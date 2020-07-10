import axios from "axios";
import chalk from "chalk"
import {fail, createAndLogAssetUrl} from "./common";

function validateHeadParameters(url: string, contentId: string) : boolean {
    return url && url !== "" && contentId && contentId !=="";
}

function showHeadUsage() {
    console.log(chalk.yellow(`
        Invalid parameters for 'head' command.
        Usage:   storage-cli head colossusURL contentID
        Example: storage-cli head http://localhost:3001 0x7a6ba7e9157e5fba190dc146fe1baa8180e29728a5c76779ed99655500cff795
      `));
}

export async function run(api: any, url: string, contentId: string) {
    if (!validateHeadParameters(url, contentId)){
        return showHeadUsage();
    }
    const assetUrl = createAndLogAssetUrl(url, contentId);

    try {
        const response = await axios.head(assetUrl);

        console.log(chalk.green(`Content type: ${response.headers['content-type']}`));
        console.log(chalk.green(`Content length: ${response.headers['content-length']}`));

    } catch (err) {
        fail(`Colossus request failed: ${err.message}`);
    }
}

