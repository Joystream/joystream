import axios from "axios";
import chalk from "chalk"
import fs from "fs";
import ipfsHash from "ipfs-only-hash";
import { ContentId, DataObject } from '@joystream/types/media';

// requesetType: 'stream' - same as download??



async function computeIpfsHash(filePath: string): Promise<string> {
    const file = fs.createReadStream(filePath)
        .on('error', (err) => {
            const message = `File read failed: ${err}`;
            console.log(chalk.red(message));
            process.exit(1);
        });

    return await ipfsHash.of(file);
}

export async function run(api: any){
    const filePath = './local.mp4';

    const ipfsHashValue = await computeIpfsHash(filePath);
    const contentId = ContentId.generate();

    console.log(ipfsHashValue);
    console.log(contentId.toString());
}
