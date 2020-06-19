import React from 'react';
import BN from 'bn.js';
import axios, { CancelTokenSource } from 'axios';
import { History } from 'history';
import { Progress, Message } from 'semantic-ui-react';

import { InputFileAsync } from '@polkadot/react-components/index';
import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { SubmittableResult } from '@polkadot/api';
import { Option } from '@polkadot/types/codec';
import { withMulti, withApi } from '@polkadot/react-api';
import { formatNumber } from '@polkadot/util';

import translate from './translate';
import { fileNameWoExt } from './utils';
import { ContentId, DataObject } from '@joystream/types/media';
import { withOnlyMembers, MyAccountProps } from '@polkadot/joy-utils/MyAccount';
import { DiscoveryProviderProps, withDiscoveryProvider } from './DiscoveryProvider';
import TxButton from '@polkadot/joy-utils/TxButton';
import IpfsHash from 'ipfs-only-hash';
import { ChannelId } from '@joystream/types/content-working-group';
import { EditVideoView } from './upload/EditVideo.view';
import { JoyInfo } from '@polkadot/joy-utils/JoyStatus';
import { IterableFile } from './IterableFile';
import { StorageProviderId } from '@joystream/types/working-group';

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
  error?: any;
  file?: File;
  computingHash: boolean;
  ipfs_cid?: string;
  newContentId: ContentId;
  discovering: boolean;
  uploading: boolean;
  progress: number;
  cancelSource: CancelTokenSource;
};

const defaultState = (): State => ({
  error: undefined,
  file: undefined,
  computingHash: false,
  ipfs_cid: undefined,
  newContentId: ContentId.generate(),
  discovering: false,
  uploading: false,
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
    const { error, uploading, discovering, computingHash } = this.state;

    if (error) return this.renderError();
    else if (discovering) return this.renderDiscovering();
    else if (uploading) return this.renderUploading();
    else if (computingHash) return this.renderComputingHash();
    else return this.renderFileInput();
  }

  private renderError () {
    const { error } = this.state;
    return (
      <Message error className='JoyMainStatus'>
        <Message.Header>Failed to upload your file</Message.Header>
        <p>{error.toString()}</p>
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
    const { history, match: { params: { channelId } } } = this.props;

    return <div style={{ width: '100%' }}>
      {this.renderProgress()}
      {success &&
        <EditVideoView
          channelId={new ChannelId(channelId)}
          contentId={newContentId}
          fileName={fileNameWoExt(file.name)}
          history={history}
        />
      }
    </div>;
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
        label=""
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
          size='large'
          label={'Upload'}
          isDisabled={!file_name}
          tx={'dataDirectory.addContent'}
          params={this.buildTxParams()}
          txSuccessCb={this.onDataObjectCreated}
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
      this.startComputingHash();
    }
  }

  private async startComputingHash () {
    const { file } = this.state;

    if (!file) {
      return this.hashComputationComplete(undefined, 'No file passed to hasher');
    }

    try {
      const iterableFile = new IterableFile(file, { chunkSize: 65535 });
      const ipfs_cid = await IpfsHash.of(iterableFile);

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
    this.setState({ discovering: true });

    const { api } = this.props;
    const { newContentId } = this.state;
    let dataObject: Option<DataObject>;
    try {
      dataObject = await api.query.dataDirectory.dataObjectByContentId(newContentId) as Option<DataObject>;
    } catch (err) {
      this.setState({
        error: err,
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
      this.uploadFileTo(storageProvider);
    } else {
      this.setState({
        error: new Error('No Storage Provider assigned to process upload'),
        discovering: false
      });
    }
  }

  private uploadFileTo = async (storageProvider: StorageProviderId) => {
    const { file, newContentId, cancelSource } = this.state;
    if (!file || !file.size) {
      this.setState({
        error: new Error('No file to upload!'),
        discovering: false
      });
      return;
    }

    const contentId = newContentId.encode();
    const config = {
      headers: {
        // TODO uncomment this once the issue fixed:
        // https://github.com/Joystream/storage-node-joystream/issues/16
        // 'Content-Type': file.type
        'Content-Type': '' // <-- this is a temporary hack
      },
      cancelToken: cancelSource.token,
      onUploadProgress: (progressEvent: any) => {
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
        error: new Error(`Failed to contact storage provider: ${err.message}`),
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
    } catch (err) {
      this.setState({ progress: 0, error: err, uploading: false });
      if (axios.isCancel(err)) {
        return;
      }
      if (!err.response || (err.response.status >= 500 && err.response.status <= 504)) {
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
