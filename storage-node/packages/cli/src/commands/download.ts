import axios from "axios";
import chalk from "chalk"
import fs from "fs";
import {fail, createAndLogAssetUrl} from "./common";

export class DownloadCommand {
    private readonly api: any;
    private readonly storageNodeUrl: string;
    private readonly contentId: string;
    private readonly filePath: string;

    constructor(api: any, storageNodeUrl: string, contentId: string, filePath: string) {
        this.api = api;
        this.storageNodeUrl = storageNodeUrl;
        this.contentId = contentId;
        this.filePath = filePath;
    }

    validateDownloadParameters(url: string, contentId: string, filePath: string): boolean {
        return url && url !== "" && contentId && contentId !== "" && filePath && filePath !== "";
    }

    showDownloadUsage() {
        console.log(chalk.yellow(`
        Invalid parameters for 'download' command.
        Usage:   storage-cli download colossusURL contentID filePath
        Example: storage-cli download http://localhost:3001 0x7a6ba7e9157e5fba190dc146fe1baa8180e29728a5c76779ed99655500cff795 ./movie.mp4
      `));
    }

    async run() {
        // Create, validate and show parameters.
        if (!this.validateDownloadParameters(this.storageNodeUrl, this.contentId, this.filePath)) {
            return this.showDownloadUsage();
        }
        const assetUrl = createAndLogAssetUrl(this.storageNodeUrl, this.contentId);
        console.log(chalk.yellow('File path:', this.filePath));

        // Create file write stream and set error handler.
        const writer = fs.createWriteStream(this.filePath)
            .on('error', (err) => {
                fail(`File write failed: ${err}`);
            });

        // Request file download.
        try {
            const response = await axios({
                url: assetUrl,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            return new Promise((resolve) => {
                writer.on('finish', () => {
                    console.log("File downloaded.")
                    resolve();
                });
            });
        } catch (err) {
            fail(`Colossus request failed: ${err.message}`);
        }
    }
}
