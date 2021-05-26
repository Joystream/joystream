import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { GroupMember } from '../../Types'
import chalk from 'chalk'
import { apiModuleByGroup } from '../../Api'
import HRTSchema from '@joystream/types/hiring/schemas/role.schema.json'
import { GenericJoyStreamRoleSchema as HRTJson } from '@joystream/types/hiring/schemas/role.schema.typings'
import { JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import WGOpeningSchema from '../../json-schemas/WorkingGroupOpening.schema.json'
import { WorkingGroupOpening as WGOpeningJson } from '../../json-schemas/typings/WorkingGroupOpening.schema'
import _ from 'lodash'
import { IOFlags, getInputJson, ensureOutputFileIsWriteable, saveOutputJsonToFile } from '../../helpers/InputOutput'
import Ajv from 'ajv'
import ExitCodes from '../../ExitCodes'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'

export default class WorkingGroupsCreateOpening extends WorkingGroupsCommandBase {
  static description = 'Create working group opening (requires lead access)'
  static flags = {
    ...WorkingGroupsCommandBase.flags,
    input: IOFlags.input,
    output: flags.string({
      char: 'o',
      required: false,
      description: 'Path to the file where the output JSON should be saved (this output can be then reused as input)',
    }),
    edit: flags.boolean({
      char: 'e',
      required: false,
      description:
        'If provided along with --input - launches in edit mode allowing to modify the input before sending the exstinsic',
      dependsOn: ['input'],
    }),
    dryRun: flags.boolean({
      required: false,
      description:
        'If provided along with --output - skips sending the actual extrinsic' +
        '(can be used to generate a "draft" which can be provided as input later)',
      dependsOn: ['output'],
    }),
  }

  getHRTDefaults(memberHandle: string): HRTJson {
    const groupName = _.startCase(this.group)
    return {
      version: 1,
      headline: `Looking for ${groupName}!`,
      job: {
        title: groupName,
        description: `Become part of the ${groupName} Group! This is a great opportunity to support Joystream!`,
      },
      application: {
        sections: [
          {
            title: 'About you',
            questions: [
              {
                title: 'Your name',
                type: 'text',
              },
              {
                title: 'What makes you a good fit for the job?',
                type: 'text area',
              },
            ],
          },
        ],
      },
      reward: '10k JOY per 3600 blocks',
      creator: {
        membership: {
          handle: memberHandle,
        },
      },
    }
  }

  createTxParams(wgOpeningJson: WGOpeningJson, hrtJson: HRTJson) {
    return [
      wgOpeningJson.activateAt,
      createType('OpeningPolicyCommitment', {
        max_review_period_length: wgOpeningJson.maxReviewPeriodLength,
        application_rationing_policy: wgOpeningJson.maxActiveApplicants
          ? { max_active_applicants: wgOpeningJson.maxActiveApplicants }
          : null,
        application_staking_policy: wgOpeningJson.applicationStake
          ? {
              amount: wgOpeningJson.applicationStake.value,
              amount_mode: wgOpeningJson.applicationStake.mode,
            }
          : null,
        role_staking_policy: wgOpeningJson.roleStake
          ? {
              amount: wgOpeningJson.roleStake.value,
              amount_mode: wgOpeningJson.roleStake.mode,
            }
          : null,
        terminate_role_stake_unstaking_period: wgOpeningJson.terminateRoleUnstakingPeriod,
        exit_role_stake_unstaking_period: wgOpeningJson.leaveRoleUnstakingPeriod,
      }),
      JSON.stringify(hrtJson),
      createType('OpeningType', 'Worker'),
    ]
  }

  async promptForData(
    lead: GroupMember,
    rememberedInput?: [WGOpeningJson, HRTJson]
  ): Promise<[WGOpeningJson, HRTJson]> {
    const openingDefaults = rememberedInput?.[0]
    const openingPrompt = new JsonSchemaPrompter<WGOpeningJson>(
      (WGOpeningSchema as unknown) as JSONSchema,
      openingDefaults
    )
    const wgOpeningJson = await openingPrompt.promptAll()

    const hrtDefaults = rememberedInput?.[1] || this.getHRTDefaults(lead.profile.handle.toString())
    this.log(`Values for ${chalk.greenBright('human_readable_text')} json:`)
    const hrtPropmpt = new JsonSchemaPrompter<HRTJson>((HRTSchema as unknown) as JSONSchema, hrtDefaults)
    // Prompt only for 'headline', 'job', 'application', 'reward' and 'process', leave the rest default
    const headline = await hrtPropmpt.promptSingleProp('headline')
    this.log('General information about the job:')
    const job = await hrtPropmpt.promptSingleProp('job')
    this.log('Application form sections and questions:')
    const application = await hrtPropmpt.promptSingleProp('application')
    this.log('Reward displayed in the opening box:')
    const reward = await hrtPropmpt.promptSingleProp('reward')
    this.log('Hiring process details (additional information)')
    const process = await hrtPropmpt.promptSingleProp('process')

    const hrtJson = { ...hrtDefaults, job, headline, application, reward, process }

    return [wgOpeningJson, hrtJson]
  }

  async getInputFromFile(filePath: string): Promise<[WGOpeningJson, HRTJson]> {
    const ajv = new Ajv({ allErrors: true })
    const inputParams = await getInputJson<[WGOpeningJson, HRTJson]>(filePath)
    if (!Array.isArray(inputParams) || inputParams.length !== 2) {
      this.error('Invalid input file', { exit: ExitCodes.InvalidInput })
    }
    const [openingJson, hrtJson] = inputParams
    if (!ajv.validate(WGOpeningSchema, openingJson)) {
      this.error(`Invalid input file:\n${ajv.errorsText(undefined, { dataVar: 'openingJson', separator: '\n' })}`, {
        exit: ExitCodes.InvalidInput,
      })
    }
    if (!ajv.validate(HRTSchema, hrtJson)) {
      this.error(`Invalid input file:\n${ajv.errorsText(undefined, { dataVar: 'hrtJson', separator: '\n' })}`, {
        exit: ExitCodes.InvalidInput,
      })
    }

    return [openingJson, hrtJson]
  }

  async run() {
    const account = await this.getRequiredSelectedAccount()
    // lead-only gate
    const lead = await this.getRequiredLead()
    await this.requestAccountDecoding(account) // Prompt for password

    const {
      flags: { input, output, edit, dryRun },
    } = this.parse(WorkingGroupsCreateOpening)

    ensureOutputFileIsWriteable(output)

    let tryAgain = false
    let rememberedInput: [WGOpeningJson, HRTJson] | undefined
    do {
      if (edit) {
        rememberedInput = await this.getInputFromFile(input as string)
      }
      // Either prompt for the data or get it from input file
      const [openingJson, hrtJson] =
        !input || edit || tryAgain
          ? await this.promptForData(lead, rememberedInput)
          : await this.getInputFromFile(input)

      // Remember the provided/fetched data in a variable
      rememberedInput = [openingJson, hrtJson]

      // Generate and ask to confirm tx params
      const txParams = this.createTxParams(openingJson, hrtJson)
      this.jsonPrettyPrint(JSON.stringify(txParams))
      const confirmed = await this.simplePrompt({
        type: 'confirm',
        message: 'Do you confirm these extrinsic parameters?',
      })
      if (!confirmed) {
        tryAgain = await this.simplePrompt({ type: 'confirm', message: 'Try again with remembered input?' })
        continue
      }

      // Save output to file
      if (output) {
        try {
          saveOutputJsonToFile(output, rememberedInput)
          this.log(chalk.green(`Output successfully saved in: ${chalk.magentaBright(output)}!`))
        } catch (e) {
          this.warn(`Could not save output to ${output}!`)
        }
      }

      if (dryRun) {
        this.exit(ExitCodes.OK)
      }

      // Send the tx
      this.log(chalk.magentaBright('Sending the extrinsic...'))
      const txSuccess = await this.sendAndFollowTx(
        account,
        this.getOriginalApi().tx[apiModuleByGroup[this.group]].addOpening(...txParams),
        true // warnOnly
      )

      // Display a success message on success or ask to try again on error
      if (txSuccess) {
        this.log(chalk.green('Opening successfully created!'))
        tryAgain = false
      } else {
        tryAgain = await this.simplePrompt({ type: 'confirm', message: 'Try again with remembered input?' })
      }
    } while (tryAgain)
  }
}
