import { ElectionStage } from '@joystream/types';
import { formatNumber, formatBalance } from '@polkadot/util';
import { BlockNumber } from '@polkadot/types/interfaces';
import Command from '@oclif/command';
import { CouncilInfoObj, NameValueObj } from '../../Types';
import { displayHeader, displayNameValueTable } from '../../helpers/display';
import Api from '../../Api';

export default class CouncilInfo extends Command {
    static description = 'Get current council and council elections information';

    displayInfo(infoObj: CouncilInfoObj) {
        const { activeCouncil = [], round, stage } = infoObj;

        displayHeader('Council');
        const councilRows: NameValueObj[] = [
            { name: 'Elected:', value: activeCouncil.length ? 'YES' : 'NO' },
            { name: 'Members:', value: activeCouncil.length.toString() },
            { name: 'Term ends at block:', value: `#${formatNumber(infoObj.termEndsAt) }` },
        ];
        displayNameValueTable(councilRows);


        displayHeader('Election');
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
        displayNameValueTable(electionTableRows);

        displayHeader('Configuration');
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
        displayNameValueTable(configTableRows);
    }

    async run() {
        const api = await Api.create();
        const infoObj = await api.getCouncilInfo();
        this.displayInfo(infoObj);
        this.exit();
    }
  }
