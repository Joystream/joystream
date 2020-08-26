import React from 'react';
import BN from 'bn.js';
import axios, { CancelTokenSource, AxiosError, AxiosRequestConfig } from 'axios';
import { History } from 'history';
import { Progress, Message } from 'semantic-ui-react';

import { mockRegistry } from '@joystream/types';
import { InputFileAsync, TxButton, JoyInfo, Loading } from '@polkadot/joy-utils/react/components';
import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { SubmittableResult } from '@polkadot/api';
import { Option } from '@polkadot/types/codec';
import { withMulti, withApi } from '@polkadot/react-api';
import { formatNumber } from '@polkadot/util';

import translate from './translate';
import { fileNameWoExt } from './utils';
import { ContentId, DataObject } from '@joystream/types/media';
import { MyAccountProps } from '@polkadot/joy-utils/react/hocs/accounts';
import { withOnlyMembers } from '@polkadot/joy-utils/react/hocs/guards';
import { DiscoveryProviderProps, withDiscoveryProvider } from './DiscoveryProvider';

import IpfsHash from 'ipfs-only-hash';
import { ChannelId } from '@joystream/types/content-working-group';
import { EditVideoView } from './upload/EditVideo.view';

import { IterableFile } from './IterableFile';
import { StorageProviderId } from '@joystream/types/working-group';
import { normalizeError, isObjectWithProperties } from '@polkadot/joy-utils/functions/misc';

const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type Props = ApiProps & I18nProps & DiscoveryProviderProps & MyAccountProps & {
  channelId: ChannelId;
  history?: History;
  match: {
    params: {
      channelId: string;
    };
  };
};

type State = {
  error?: string;
  file?: File;
  computingHash: boolean;
  ipfs_cid?: string;
  newContentId: ContentId;
  discovering: boolean;
  uploading: boolean;
  sendingTx: boolean;
  progress: number;
  cancelSource: CancelTokenSource;
};

const defaultState = (): State => ({
  error: undefined,
  file: undefined,
  computingHash: false,
  ipfs_cid: undefined,
  newContentId: ContentId.generate(mockRegistry),
  discovering: false,
  uploading: false,
  sendingTx: false,
  progress: 0,
  cancelSource: axios.CancelToken.source()
});

class Upload extends React.PureComponent<Props, State> {
  state = defaultState();

  componentWillUnmount () {
    this.setState({
      discovering: false,
      uploading: false
    });

    const { cancelSource } = this.state;

    cancelSource.cancel('unmounting');
  }

  render () {
    return (
      <div className='UploadBox'>
        {this.renderContent()}
      </div>
    );
  }

  private renderContent () {
    const { error, uploading, discovering, computingHash, sendingTx } = this.state;

    if (error) return this.renderError(error);
    else if (discovering) return this.renderDiscovering();
    else if (uploading) return this.renderUploading();
    else if (computingHash) return this.renderComputingHash();
    else if (sendingTx) return this.renderSendingTx();
    else return this.renderFileInput();
  }

  private renderError (error: string) {
    return (
      <Message error className='JoyMainStatus'>
        <Message.Header>Failed to upload your file</Message.Header>
        <p>{error}</p>
        <button className='ui button' onClick={this.resetForm}>Start over</button>
      </Message>
    );
  }

  private resetForm = () => {
    const { cancelSource } = this.state;

    this.setState({
      ...defaultState(),
      cancelSource
    });
  }

  private renderUploading () {
    const { file, newContentId, progress, error } = this.state;

    if (!file || !file.name) return <JoyInfo title='Loading...' />;

    const success = !error && progress >= 100;
    const { history, match: { params: { channelId } }, api } = this.props;

    return <div style={{ width: '100%' }}>
      {this.renderProgress()}
      {success &&
        <EditVideoView
          channelId={api.createType('ChannelId', channelId)}
          contentId={newContentId}
          fileName={fileNameWoExt(file.name)}
          history={history}
        />
      }
    </div>;
  }

  private renderSendingTx () {
    return <JoyInfo title='Please wait...'><Loading text='Waiting for the transaction confirmation...' /></JoyInfo>;
  }

  private renderDiscovering () {
    return <JoyInfo title={'Please wait...'}>Contacting storage provider.</JoyInfo>;
  }

  private renderProgress () {
    const { progress, error } = this.state;
    const active = !error && progress < 100;
    const success = !error && progress >= 100;

    let label = '';

    if (active) {
      label = 'Your file is uploading. Please keep this page open until it\'s done.';
    } else if (success) {
      label = 'Uploaded! Click "Publish" button to make your file live.';
    }

    return <Progress
      className='UploadProgress'
      progress={success}
      percent={progress}
      active={active}
      success={success}
      label={label}
    />;
  }

  private renderFileInput () {
    const { file } = this.state;
    const file_size = file ? file.size : 0;
    const file_name = file ? file.name : '';

    return <div className='UploadSelectForm'>
      <InputFileAsync
        label=''
        withLabel={false}
        className={`UploadInputFile ${file_name ? 'FileSelected' : ''}`}
        placeholder={
          <div>
            <div><i className='cloud upload icon'></i></div>
            <div>{file_name
              ? `${file_name} (${formatNumber(file_size)} bytes)`
              : <>
                <div>Drag and drop either video or audio file here.</div>
                <div>Your file should not be more than {MAX_FILE_SIZE_MB} MB.</div>
              </>
            }</div>
          </div>
        }
        onChange={this.onFileSelected}
      />
      {file_name && <div className='UploadButtonBox'>
        <TxButton
          label={'Upload'}
          isDisabled={!file_name}
          tx={'dataDirectory.addContent'}
          params={this.buildTxParams()}
          onClick={(sendTx) => {
            this.setState({ sendingTx: true });
            sendTx();
          }}
          txSuccessCb={ this.onDataObjectCreated }
          txFailedCb={() => { this.setState({ sendingTx: false }); }}
        />
      </div>}
    </div>;
  }

  private onFileSelected = (file: File) => {
    if (!file.size) {
      this.setState({ error: 'You cannot upload an empty file.' });
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      this.setState({
        error:
        `You can't upload files larger than ${MAX_FILE_SIZE_MB} MBytes in size.`
      });
    } else {
      this.setState({ file, computingHash: true });
      void this.startComputingHash();
    }
  }

  private async startComputingHash () {
    const { file } = this.state;

    if (!file) {
      return this.hashComputationComplete(undefined, 'No file passed to hasher');
    }

    try {
      const iterableFile = new IterableFile(file, { chunkSize: 65535 });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      const ipfs_cid = (await IpfsHash.of(iterableFile)) as string;

      this.hashComputationComplete(ipfs_cid);
    } catch (err) {
      return this.hashComputationComplete(undefined, err);
    }
  }

  private hashComputationComplete (ipfs_cid: string | undefined, error?: string) {
    if (!error) {
      console.log('Computed IPFS hash:', ipfs_cid);
    }

    this.setState({
      computingHash: false,
      ipfs_cid,
      error
    });
  }

  private renderComputingHash () {
    return <JoyInfo title='Processing your file. Please wait...' />;
  }

  private buildTxParams = () => {
    const { file, newContentId, ipfs_cid } = this.state;

    if (!file || !ipfs_cid) return [];

    // TODO get corresponding data type id based on file content
    const dataObjectTypeId = new BN(1);
    const { myMemberId } = this.props;

    return [myMemberId, newContentId, dataObjectTypeId, new BN(file.size), ipfs_cid];
  }

  private onDataObjectCreated = async (_txResult: SubmittableResult) => {
    this.setState({ sendingTx: false, discovering: true });

    const { api } = this.props;
    const { newContentId } = this.state;
    let dataObject: Option<DataObject>;

    try {
      dataObject = await api.query.dataDirectory.dataObjectByContentId(newContentId) as Option<DataObject>;
    } catch (err) {
      this.setState({
        error: normalizeError(err),
        discovering: false
      });

      return;
    }

    const { discovering } = this.state;

    if (!discovering) {
      return;
    }

    if (dataObject.isSome) {
      const storageProvider = dataObject.unwrap().liaison;

      void this.uploadFileTo(storageProvider);
    } else {
      this.setState({
        error: 'No Storage Provider assigned to process upload',
        discovering: false
      });
    }
  }

  private uploadFileTo = async (storageProvider: StorageProviderId) => {
    const { file, newContentId, cancelSource } = this.state;

    if (!file || !file.size) {
      this.setState({
        error: 'No file to upload!',
        discovering: false
      });

      return;
    }

    const contentId = newContentId.encode();
    const config: AxiosRequestConfig = {
      headers: {
        // TODO uncomment this once the issue fixed:
        // https://github.com/Joystream/storage-node-joystream/issues/16
        // 'Content-Type': file.type
        'Content-Type': '' // <-- this is a temporary hack
      },
      cancelToken: cancelSource.token,
      onUploadProgress: (progressEvent: unknown) => {
        if (
          !isObjectWithProperties(progressEvent, 'loaded', 'total') ||
          typeof progressEvent.loaded !== 'number' ||
          typeof progressEvent.total !== 'number'
        ) {
          return;
        }

        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);

        this.setState({
          progress: percentCompleted
        });
      }
    };

    const { discoveryProvider } = this.props;
    let url: string;

    try {
      url = await discoveryProvider.resolveAssetEndpoint(storageProvider, contentId, cancelSource.token);
    } catch (err) {
      return this.setState({
        error: `Failed to contact storage provider: ${normalizeError(err)}`,
        discovering: false
      });
    }

    const { discovering } = this.state;

    if (!discovering) {
      return;
    }

    // TODO: validate url .. must start with http

    this.setState({ discovering: false, uploading: true, progress: 0 });

    try {
      await axios.put<{ message: string }>(url, file, config);
    } catch (e) {
      const err = e as unknown;

      this.setState({ progress: 0, error: normalizeError(err), uploading: false });

      if (axios.isCancel(err)) {
        return;
      }

      const response = isObjectWithProperties(err, 'response')
        ? (err as AxiosError).response
        : undefined;

      if (!response || (response.status >= 500 && response.status <= 504)) {
        // network connection error
        discoveryProvider.reportUnreachable(storageProvider);
      }
    }
  }
}

export const UploadWithRouter = withMulti(
  Upload,
  translate,
  withApi,
  withOnlyMembers,
  withDiscoveryProvider
);
