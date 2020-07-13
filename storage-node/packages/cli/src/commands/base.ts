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

    // Abstract method to provide parameter validation.
    protected abstract validateParameters() : boolean;

    // Abstract method to show command usage.
    protected abstract showUsage();

    // Checks command parameters and shows the usage if necessary.
    protected assertParameters() : boolean {
        // Create, validate and show parameters.
        if (!this.validateParameters()) {
            console.log(chalk.yellow(`Invalid parameters for the command:`));
            this.showUsage();

            return false;
        }

        return true;
    }

    // Shows the error message and ends the process with error code.
    protected fail(message: string) {
        console.log(chalk.red(message));
        process.exit(1);
    }
}
