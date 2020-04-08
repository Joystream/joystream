import BN from 'bn.js';
import { cli } from 'cli-ux';
import chalk from 'chalk';
import { Command } from '@oclif/command';
import { registerJoystreamTypes, ElectionStage, Seat } from '@joystream/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { formatNumber, formatBalance } from '@polkadot/util';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';

const API_URL = 'wss://rome-staging-2.joystream.org/staging/rpc/';

type ElectionsInfoTuple = Parameters<typeof createElectionsInfoObj>;
type ElectionsInfoObj = ReturnType<typeof createElectionsInfoObj>;
type NameValueObj = { name: string, value: string };

function createElectionsInfoObj(
    activeCouncil: Seat[] | undefined,
    termEndsAt: BlockNumber | undefined,
    autoStart: Boolean | undefined,
    newTermDuration: BN | undefined,
    candidacyLimit: BN | undefined,
    councilSize: BN | undefined,
    minCouncilStake: Balance | undefined,
    minVotingStake: Balance | undefined,
    announcingPeriod: BlockNumber | undefined,
    votingPeriod: BlockNumber | undefined,
    revealingPeriod: BlockNumber | undefined,
    round: BN | undefined,
    stage: Option<ElectionStage> | undefined
) {
    return {
        activeCouncil,
        termEndsAt,
        autoStart,
        newTermDuration,
        candidacyLimit,
        councilSize,
        minCouncilStake,
        minVotingStake,
        announcingPeriod,
        votingPeriod,
        revealingPeriod,
        round,
        stage
    };
}

export default class CouncilInfo extends Command {
    static description = 'Get current council and council elections information';

    displayHeader(caption: string, placeholderSign: string = '_', size: number = 50) {
        let singsPerSide: number = Math.floor((size - (caption.length + 2)) / 2);
        let finalStr: string = '';
        for (let i = 0; i < singsPerSide; ++i) finalStr += placeholderSign;
        finalStr += ` ${ caption} `;
        while (finalStr.length < size) finalStr += placeholderSign;

        console.log("\n" + chalk.bold.blueBright(finalStr) + "\n");
    }

    displayTable(rows: NameValueObj[]) {
        cli.table(
            rows,
            {
                name: { minWidth: 30, get: row => chalk.bold.white(row.name) },
                value: { get: row => chalk.white(row.value) }
            },
            { 'no-header': true }
        );
    }

    displayInfo(infoObj: ElectionsInfoObj) {
        const { activeCouncil = [], round, stage } = infoObj;

        this.displayHeader('Council');
        const councilRows: NameValueObj[] = [
            { name: 'Elected:', value: activeCouncil.length ? 'YES' : 'NO' },
            { name: 'Members:', value: activeCouncil.length.toString() },
            { name: 'Term ends at block:', value: `#${formatNumber(infoObj.termEndsAt) }` },
        ];
        this.displayTable(councilRows);


        this.displayHeader('Election');
        let electionTableRows: NameValueObj[] = [
            { name: 'Running:', value: stage && stage.isSome ? 'YES' : 'NO' },
            { name: 'Election round:', value: formatNumber(round) }
        ];
        if (stage && stage.isSome) {
            const stageValue = <ElectionStage> stage.value;
            const stageName: string = stageValue.type;
            const stageEndsAt = <BlockNumber> stageValue.value;
            electionTableRows.push({ name: 'Stage:', value: stageName });
            electionTableRows.push({ name: 'Stage ends at block:', value: `#${stageEndsAt}` });
        }
        this.displayTable(electionTableRows);

        this.displayHeader('Configuration');
        const isAutoStart = (infoObj.autoStart || false).valueOf();
        const configTableRows: NameValueObj[] = [
            { name: 'Auto-start elections:', value: isAutoStart ? 'YES' : 'NO' },
            { name: 'New term duration:', value: formatNumber(infoObj.newTermDuration) },
            { name: 'Candidacy limit:', value: formatNumber(infoObj.candidacyLimit) },
            { name: 'Council size:', value: formatNumber(infoObj.councilSize) },
            { name: 'Min. council stake:', value: formatBalance(infoObj.minCouncilStake) },
            { name: 'Min. voting stake:', value: formatBalance(infoObj.minVotingStake) },
            { name: 'Announcing period:', value: `${ formatNumber(infoObj.announcingPeriod) } blocks` },
            { name: 'Voting period:', value: `${ formatNumber(infoObj.votingPeriod) } blocks` },
            { name: 'Revealing period:', value: `${ formatNumber(infoObj.revealingPeriod) } blocks` }
        ];
        this.displayTable(configTableRows);
    }

    async run() {
        // TODO: This should probably be part of some command abstract base class (like: ApiCommandBase)
        formatBalance.setDefaults({ unit: 'JOY' });
        const wsProvider:WsProvider = new WsProvider(API_URL);
        registerJoystreamTypes();
        const api:ApiPromise = await ApiPromise.create({ provider: wsProvider });

        const unsub = await api.queryMulti(
            [
                api.query.council.activeCouncil,
                api.query.council.termEndsAt,
                api.query.councilElection.autoStart,
                api.query.councilElection.newTermDuration,
                api.query.councilElection.candidacyLimit,
                api.query.councilElection.councilSize,
                api.query.councilElection.minCouncilStake,
                api.query.councilElection.minVotingStake,
                api.query.councilElection.announcingPeriod,
                api.query.councilElection.votingPeriod,
                api.query.councilElection.revealingPeriod,
                api.query.councilElection.round,
                api.query.councilElection.stage
            ],
            ((res) => {
                const infoObj: ElectionsInfoObj = createElectionsInfoObj(...(<ElectionsInfoTuple> res));
                this.displayInfo(infoObj);
            })
        );
        unsub();
        this.exit();
    }
  }
