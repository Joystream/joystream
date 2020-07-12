import axios from "axios";
import chalk from "chalk"
import {BaseCommand} from "./base";

// Head command class. Validates input parameters and obtains the asset headers.
export class HeadCommand extends BaseCommand{
    private readonly api: any;
    private readonly storageNodeUrl: string;
    private readonly contentId: string;

    constructor(api: any, storageNodeUrl: string, contentId: string) {
        super();

        this.api = api;
        this.storageNodeUrl = storageNodeUrl;
        this.contentId = contentId;
    }

    validateHeadParameters(url: string, contentId: string): boolean {
        return url && url !== "" && contentId && contentId !== "";
    }

    showHeadUsage() {
        console.log(chalk.yellow(`
        Invalid parameters for 'head' command.
        Usage:   storage-cli head colossusURL contentID
        Example: storage-cli head http://localhost:3001 0x7a6ba7e9157e5fba190dc146fe1baa8180e29728a5c76779ed99655500cff795
      `));
    }

    async run() {
        if (!this.validateHeadParameters(this.storageNodeUrl, this.contentId)) {
            return this.showHeadUsage();
        }
        const assetUrl = this.createAndLogAssetUrl(this.storageNodeUrl, this.contentId);

        try {
            const response = await axios.head(assetUrl);

            console.log(chalk.green(`Content type: ${response.headers['content-type']}`));
            console.log(chalk.green(`Content length: ${response.headers['content-length']}`));

        } catch (err) {
            this.fail(`Colossus request failed: ${err.message}`);
        }
    }
}
