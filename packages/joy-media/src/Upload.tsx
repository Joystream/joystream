import React from 'react';
import BN from 'bn.js';
import axios from 'axios';
import { Progress, Message } from 'semantic-ui-react';

import { InputFile } from '@polkadot/ui-app/index';
import { ApiProps } from '@polkadot/ui-api/types';
import { I18nProps } from '@polkadot/ui-app/types';
import { SubmittableResult } from '@polkadot/api';
import { withMulti } from '@polkadot/ui-api';
import { formatNumber } from '@polkadot/util';

import translate from './translate';
import { fileNameWoExt } from './utils';
import { ContentId } from './types';
import { MyAccountProps, withOnlyMembers } from '@polkadot/joy-utils/MyAccount';
import { withStorageProvider, StorageProviderProps } from './StorageProvider';
import EditMeta from './EditMeta';
import TxButton from '@polkadot/joy-utils/TxButton';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type Props = ApiProps & I18nProps & MyAccountProps & StorageProviderProps;

type State = {
  error?: any,
  file?: File,
  newContentId: ContentId,
  uploading: boolean,
  progress: number
};

const defaultState = (): State => ({
  error: undefined,
  file: undefined,
  newContentId: ContentId.generate(),
  uploading: false,
  progress: 0
});

class Component extends React.PureComponent<Props, State> {

  state = defaultState();

  render () {
    return (
      <div className='UploadBox'>
        {this.renderContent()}
      </div>
    );
  }

  private renderContent () {
    const { error, uploading } = this.state;

    if (error) return this.renderError();
    else if (uploading) return this.renderUploading();
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
    this.setState(defaultState());
  }

  private renderUploading () {
    const { file, newContentId } = this.state;
    if (!file) return <em>Loading...</em>;

    return <>
      <div className='UploadSidebar'>
        TODO show thumbnail here !!!
      </div>
      <div className='UploadMainContent'>
        {this.renderProgress()}
        <EditMeta contentId={newContentId} fileName={fileNameWoExt(file.name)} />
      </div>
    </>;
  }

  private renderProgress () {
    const { progress, error } = this.state;
    const active = !error && progress < 100;
    const success = !error && progress >= 100;

    // This is a visual hack to show that progress bar is active while uploading a file.
    const percent = 100;

    let label = '';
    if (active) {
      label = `Your file is uploading. Please keep this page open until it's done.`;
    } else if (success) {
      label = `Uploaded! Click "Publish" button to make your file live.`;
    }

    return <Progress
      progress={success}
      percent={percent}
      active={active}
      success={success}
      label={label}
    />;
  }

  private renderFileInput () {
    const { file } = this.state;

    return <div className='UploadSelectForm'>
      <InputFile
        withLabel={false}
        className={`UploadInputFile ${file ? 'FileSelected' : ''}`}
        placeholder={
          <div>
            <div><i className='cloud upload icon'></i></div>
            <div>{file
              ? `${file.name} (${formatNumber(file.size)} bytes)`
              : <>
                <div>Drag and drop either video or audio file here.</div>
                <div>Your file should not be more than {MAX_FILE_SIZE_MB} MB.</div>
              </>
            }</div>
          </div>
        }
        onFileSelected={this.onFileSelected}
      />
      {file && <div className='UploadButtonBox'>
        <TxButton
          size='large'
          label={'Upload'}
          isDisabled={!file}
          tx={'dataDirectory.addContent'}
          params={this.buildTxParams()}
          txSuccessCb={this.onDataObjectCreated}
        />
      </div>}
    </div>;
  }

  private onFileSelected = (data: Uint8Array, file: File) => {
    if (!data || data.length === 0) {
      this.setState({ error: `You cannot upload an empty file.` });
    } else if (data.length > MAX_FILE_SIZE_BYTES) {
      this.setState({ error:
        `You cannot upload a file that is more than ${MAX_FILE_SIZE_MB} MB.`
      });
    } else {
      // File size is valid and can be uploaded:
      this.setState({ file });
    }
  }

  private buildTxParams = () => {
    const { file, newContentId } = this.state;
    if (!file) return [];

    // TODO get corresponding data type id based on file content
    const dataObjectTypeId = new BN(1);

    return [ newContentId, dataObjectTypeId, new BN(file.size) ];
  }

  private onDataObjectCreated = (_txResult: SubmittableResult) => {
    this.uploadFile();
  }

  private uploadFile = () => {
    const { file, newContentId } = this.state;
    if (!file) return;

    const uniqueName = newContentId.toAddress();
    const config = {
      headers: {
        // TODO uncomment this once the issue fixed:
        // https://github.com/Joystream/storage-node-joystream/issues/16
        // 'Content-Type': file.type
        'Content-Type': '' // <-- this is a temporary hack
      }
    };
    const { storageProvider } = this.props;
    const url = storageProvider.buildApiUrl(uniqueName);
    this.setState({ uploading: true });

    axios
      .put<{ message: string }>(url, file, config)
      .then(_res => this.setState({ progress: 100 }))
      .catch(error => this.setState({ progress: 100, error }));
  }
}

export default withMulti(
  Component,
  translate,
  withOnlyMembers,
  withStorageProvider
);
