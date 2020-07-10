import axios, {AxiosRequestConfig} from "axios";
import chalk from "chalk"
import fs from "fs";
import ipfsHash from "ipfs-only-hash";
import { ContentId, DataObject } from '@joystream/types/media';
import BN from "bn.js";
import { Option } from '@polkadot/types/codec';
import Debug from "debug";
const debug = Debug('joystream:storage-cli:upload');


// Defines maximum content length for the assets (files). Limits the upload.
const MAX_CONTENT_LENGTH = 500 * 1024 * 1024; // 500Mb

function fail(message: string) {
    console.log(chalk.red(message));
    process.exit(1);
}

async function computeIpfsHash(filePath: string): Promise<string> {
    const file = fs.createReadStream(filePath)
        .on('error', (err) => {
            fail(`File read failed: ${err}`);
        });

    return await ipfsHash.of(file);
}

function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}

//
interface AddContentParams {
    accountId: string,
    ipfsCid: string,
    contentId: string,
    fileSize: BN,
    dataObjectTypeId: number,
    memberId: number
}

// Composes an asset URL and logs it to console.
function createAndLogAssetUrl(url: string, contentId: string) : string {
    const assetUrl = `${url}/asset/v0/${contentId}`;
    console.log(chalk.yellow('Generated asset URL:', assetUrl));

    return assetUrl;
}

function getAccountId(api: any) : string {
    const ALICE_URI = '//Alice'

    return api.identities.keyring.addFromUri(ALICE_URI, null, 'sr25519').address
}

// Creates parameters for the AddContent runtime tx.
async function getAddContentParams(api: any, filePath: string): Promise<AddContentParams> {
    const dataObjectTypeId = 1;
    const memberId = 0; // alice
    const accountId = getAccountId(api)

    return {
        accountId,
        ipfsCid: await computeIpfsHash(filePath),
        contentId: ContentId.generate().encode(),
        fileSize: new BN(getFileSize(filePath)),
        dataObjectTypeId,
        memberId
    };
}

// Creates the DataObject in the runtime.
async function createContent(api: any, p: AddContentParams) : Promise<DataObject> {
    try {
        const dataObject: Option<DataObject> = await api.assets.createDataObject(
            p.accountId,
            p.memberId,
            p.contentId,
            p.dataObjectTypeId,
            p.fileSize,
            p.ipfsCid
        );

        if (dataObject.isNone) {
            fail("Cannot create data object: got None object");
        }

        return dataObject.unwrap();
    } catch (err) {
        fail(`Cannot create data object: ${err}`);
    }
}

// Command executor.
export async function run(api: any, filePath: string){
    let addContentParams = await getAddContentParams(api, filePath);
    debug(`AddContent Tx params: ${addContentParams}`); // debug
    debug(`Decoded CID: ${ContentId.decode(addContentParams.contentId).toString()}`);

    let dataObject = await createContent(api, addContentParams);
    debug(`Received data object: ${dataObject.toString()}`); // debug

    let assetUrl = createAndLogAssetUrl("http://localhost:3001", addContentParams.contentId);
    await uploadFile(assetUrl, filePath);
}

// Uploads file to given asset URL.
async function uploadFile(assetUrl: string, filePath: string) {
    // Create file read stream and set error handler.
    const file = fs.createReadStream(filePath)
        .on('error', (err) => {
            fail(`File read failed: ${err}`);
        });

    // Upload file from the stream.
    try {
        const fileSize = getFileSize(filePath);
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': '', // https://github.com/Joystream/storage-node-joystream/issues/16
                'Content-Length': fileSize.toString()
            },
            'maxContentLength': MAX_CONTENT_LENGTH,
        };
        await axios.put(assetUrl, file, config);

        console.log("File uploaded.");
    } catch (err) {
        fail(err.toString());
    }
}
