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

// Defines the necessary parameters for the AddContent runtime tx.
interface AddContentParams {
    accountId: string,
    ipfsCid: string,
    contentId: string,
    fileSize: BN,
    dataObjectTypeId: number,
    memberId: number
}

export class UploadCommand {
    private readonly api: any;
    private readonly mediaSourceFilePath: string;
    private readonly dataObjectTypeId: string;
    private readonly keyFile: string;
    private readonly passPhrase: string;
    private readonly memberId: string;

    constructor(api: any,
                mediaSourceFilePath: string,
                dataObjectTypeId: string,
                keyFile: string,
                passPhrase: string,
                memberId: string
    ) {
        this.api = api;
        this.mediaSourceFilePath = mediaSourceFilePath;
        this.dataObjectTypeId = dataObjectTypeId;
        this.keyFile = keyFile;
        this.passPhrase = passPhrase;
        this.memberId = memberId;
    }

    // Reads the file from the filesystem and computes IPFS hash.
    async computeIpfsHash(): Promise<string> {
        const file = fs.createReadStream(this.mediaSourceFilePath)
            .on('error', (err) => {
                fail(`File read failed: ${err}`);
            });

        return await ipfsHash.of(file);
    }

    // Read the file size from the file system.
    getFileSize(): number {
        const stats = fs.statSync(this.mediaSourceFilePath);
        return stats.size;
    }

    // Creates parameters for the AddContent runtime tx.
    async getAddContentParams(): Promise<AddContentParams> {
        const identity = await this.loadIdentity();
        const accountId = identity.address;

        let dataObjectTypeId: number = parseInt(this.dataObjectTypeId);
        if (isNaN(dataObjectTypeId)) {
            fail(`Cannot parse dataObjectTypeId: ${this.dataObjectTypeId}`);
        }

        let memberId: number = parseInt(this.memberId);
        if (isNaN(dataObjectTypeId)) {
            fail(`Cannot parse memberIdString: ${this.memberId}`);
        }

        return {
            accountId,
            ipfsCid: await this.computeIpfsHash(),
            contentId: ContentId.generate().encode(),
            fileSize: new BN(this.getFileSize()),
            dataObjectTypeId,
            memberId
        };
    }

    // Creates the DataObject in the runtime.
    async createContent(p: AddContentParams): Promise<DataObject> {
        try {
            const dataObject: Option<DataObject> = await this.api.assets.createDataObject(
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
    async uploadFile(assetUrl: string) {
        // Create file read stream and set error handler.
        const file = fs.createReadStream(this.mediaSourceFilePath)
            .on('error', (err) => {
                fail(`File read failed: ${err}`);
            });

        // Upload file from the stream.
        try {
            const fileSize = this.getFileSize();
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
    async discoverStorageProviderEndpoint(storageProviderId: string): Promise<string> {
        try {
            const serviceInfo = await discover(storageProviderId, this.api);

            if (serviceInfo === null) {
                fail("Storage node discovery failed.");
            }
            debug(`Discovered service info object: ${serviceInfo}`);

            const dataWrapper = JSON.parse(serviceInfo);
            const assetWrapper = JSON.parse(dataWrapper.serialized);

            return assetWrapper.asset.endpoint;
        } catch (err) {
            fail(`Could not get asset endpoint: ${err}`);
        }
    }

    // Loads and unlocks the runtime identity using the key file and pass phrase.
    async loadIdentity(): Promise<any> {
        try {
            await fs.promises.access(this.keyFile);
        } catch (error) {
            fail(`Cannot read file "${this.keyFile}".`)
        }

        return this.api.identities.loadUnlock(this.keyFile, this.passPhrase);
    }


    // Command executor.
    async run() {
        let addContentParams = await this.getAddContentParams();
        debug(`AddContent Tx params: ${JSON.stringify(addContentParams)}`);
        debug(`Decoded CID: ${ContentId.decode(addContentParams.contentId).toString()}`);

        let dataObject = await this.createContent(addContentParams);
        debug(`Received data object: ${dataObject.toString()}`);

        let colossusEndpoint = await this.discoverStorageProviderEndpoint(dataObject.liaison.toString());
        debug(`Discovered storage node endpoint: ${colossusEndpoint}`);

        let assetUrl = createAndLogAssetUrl(colossusEndpoint, addContentParams.contentId);
        await this.uploadFile(assetUrl);
    }
}
