import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import ipfsHash from "ipfs-only-hash";
import { ContentId, DataObject } from '@joystream/types/media';
import BN from "bn.js";
import { Option } from '@polkadot/types/codec';
import {fail, createAndLogAssetUrl} from "./common";
import {discover} from "@joystream/service-discovery/discover";
import Debug from "debug";
const debug = Debug('joystream:storage-cli:upload');

// Defines maximum content length for the assets (files). Limits the upload.
const MAX_CONTENT_LENGTH = 500 * 1024 * 1024; // 500Mb

// Reads the file from the filesystem and computes IPFS hash.
async function computeIpfsHash(filePath: string): Promise<string> {
    const file = fs.createReadStream(filePath)
        .on('error', (err) => {
            fail(`File read failed: ${err}`);
        });

    return await ipfsHash.of(file);
}

// Read the file size from the file system.
function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}

// Defines the necessary parameters for the AddContent runtime tx.
interface AddContentParams {
    accountId: string,
    ipfsCid: string,
    contentId: string,
    fileSize: BN,
    dataObjectTypeId: number,
    memberId: number
}

// Creates parameters for the AddContent runtime tx.
async function getAddContentParams(
    api: any,
    filePath: string,
    dataObjectTypeIdString: string,
    keyFile: string,
    passPhrase: string,
    memberIdString: string
): Promise<AddContentParams> {
    const identity = await loadIdentity(api, keyFile, passPhrase);
    const accountId = identity.address;

    let dataObjectTypeId: number = parseInt(dataObjectTypeIdString);
    if (isNaN(dataObjectTypeId)) {
        fail(`Cannot parse dataObjectTypeId: ${dataObjectTypeIdString}`);
    }

    let memberId: number = parseInt(memberIdString);
    if (isNaN(dataObjectTypeId)) {
        fail(`Cannot parse memberIdString: ${memberIdString}`);
    }

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

// Requests the runtime and obtains the storage node endpoint URL.
async function discoverStorageProviderEndpoint(api: any, storageProviderId: string) : Promise<string> {
    try {
        const serviceInfo = await discover(storageProviderId, api);

        if (serviceInfo === null) {
            fail("Storage node discovery failed.");
        }
        debug(`Discovered service info object: ${serviceInfo}`);

        const dataWrapper = JSON.parse(serviceInfo);
        const assetWrapper = JSON.parse(dataWrapper.serialized);

        return assetWrapper.asset.endpoint;
    }catch (err) {
        fail(`Could not get asset endpoint: ${err}`);
    }
}

// Loads and unlocks the runtime identity using the key file and pass phrase.
async function loadIdentity(api, filename, passphrase) : Promise<any> {
    try {
        await fs.promises.access(filename);
    } catch (error) {
        fail(`Cannot read file "${filename}".`)
    }

    return api.identities.loadUnlock(filename, passphrase);
}


// Command executor.
export async function run(
    api: any,
    filePath: string,
    dataObjectTypeId: string,
    keyFile: string,
    passPhrase: string,
    memberId: string
){
    let addContentParams = await getAddContentParams(api, filePath, dataObjectTypeId, keyFile, passPhrase, memberId);
    debug(`AddContent Tx params: ${JSON.stringify(addContentParams)}`);
    debug(`Decoded CID: ${ContentId.decode(addContentParams.contentId).toString()}`);

    let dataObject = await createContent(api, addContentParams);
    debug(`Received data object: ${dataObject.toString()}`);

    let colossusEndpoint = await discoverStorageProviderEndpoint(api, dataObject.liaison.toString());
    debug(`Discovered storage node endpoint: ${colossusEndpoint}`);

    let assetUrl = createAndLogAssetUrl(colossusEndpoint, addContentParams.contentId);
    await uploadFile(assetUrl, filePath);
}
