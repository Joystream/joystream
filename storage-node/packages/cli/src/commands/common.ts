// Composes an asset URL and logs it to console.
import chalk from "chalk";

// Creates the Colossus asset URL and logs it.
export function createAndLogAssetUrl(url: string, contentId: string) : string {
    const assetUrl = `${url}/asset/v0/${contentId}`;
    console.log(chalk.yellow('Generated asset URL:', assetUrl));

    return assetUrl;
}

// Shows the error message and ends the process with error code.
export function fail(message: string) {
    console.log(chalk.red(message));
    process.exit(1);
}
