// Composes an asset URL and logs it to console.
import chalk from "chalk";
import removeEndingForwardSlash from "@joystream/storage-utils/stripEndingSlash";

// Commands base abstract class. Contains reusable methods.
export abstract class BaseCommand {
    // Creates the Colossus asset URL and logs it.
    protected createAndLogAssetUrl(url: string, contentId: string): string {
        const normalizedUrl = removeEndingForwardSlash(url);
        const assetUrl = `${normalizedUrl}/asset/v0/${contentId}`;
        console.log(chalk.yellow('Generated asset URL:', assetUrl));

        return assetUrl;
    }

    // Shows the error message and ends the process with error code.
    protected fail(message: string) {
        console.log(chalk.red(message));
        process.exit(1);
    }
}
