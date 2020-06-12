import React, { useState } from 'react';
import { FormikProps } from 'formik';
import { Icon, Loader } from 'semantic-ui-react';
import Dropzone from 'react-dropzone';

enum Status {
  Accepted = 'accepted',
  Rejected = 'rejected',
  Active = 'active',
  Parsing = 'parsing',
  Default = 'default'
}

const determineStatus = (
  acceptedFiles: File[],
  rejectedFiles: File[],
  error: string | undefined,
  isDragActive: boolean,
  parsing: boolean
): Status => {
  if (parsing) return Status.Parsing;
  if (error || rejectedFiles.length) return Status.Rejected;
  if (acceptedFiles.length) return Status.Accepted;
  if (isDragActive) return Status.Active;

  return Status.Default;
};

// Get color by status (imporant to use #FFFFFF format, so we can easily swicth the opacity!)
const getStatusColor = (status: Status): string => {
  switch (status) {
    case Status.Accepted:
      return '#00DBB0';
    case Status.Rejected:
      return '#FF3861';
    case Status.Active:
    case Status.Parsing:
      return '#000000';
    default:
      return '#333333';
  }
};

const dropdownDivStyle = (status: Status): React.CSSProperties => {
  const mainColor = getStatusColor(status);

  return {
    cursor: 'pointer',
    border: `1px solid ${mainColor + '30'}`,
    borderRadius: '3px',
    padding: '1.5em',
    color: mainColor,
    fontWeight: 'bold',
    transition: 'color 0.5s, border-color 0.5s'
  };
};

const dropdownIconStyle = (): React.CSSProperties => {
  return {
    marginRight: '0.5em',
    opacity: 0.5
  };
};

const innerSpanStyle = (): React.CSSProperties => {
  return {
    display: 'flex',
    alignItems: 'center'
  };
};

// Interpret the file as a UTF-8 string
// https://developer.mozilla.org/en-US/docs/Web/API/Blob/text
const parseFileAsUtf8 = async (file: any): Promise<string> => {
  const text = await file.text();
  return text;
};

// Interpret the file as containing binary data. This will load the entire
// file into memory which may crash the brower with very large files.
const parseFileAsBinary = async (file: any): Promise<ArrayBuffer> => {
  // return file.arrayBuffer();
  // This newer API not fully supported yet in all browsers
  // https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer

  return new Promise((resolve): void => {
    const reader = new FileReader();

    reader.onload = ({ target }: ProgressEvent<FileReader>): void => {
      if (target && target.result) {
        resolve(target.result as ArrayBuffer);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

type FileDropdownProps<FormValuesT> = {
  error: string | undefined;
  name: keyof FormValuesT & string;
  setFieldValue: FormikProps<FormValuesT>['setFieldValue'];
  setFieldTouched: FormikProps<FormValuesT>['setFieldTouched'];
  acceptedFormats: string | string[];
  defaultText: string;
  interpretAs: 'utf-8' | 'binary';
};

export default function FileDropdown<ValuesT = {}> (props: FileDropdownProps<ValuesT>) {
  const [parsing, setParsing] = useState(false);
  const { error, name, setFieldValue, setFieldTouched, acceptedFormats, defaultText, interpretAs } = props;
  return (
    <Dropzone
      onDropAccepted={async acceptedFiles => {
        setParsing(true);
        let contents;
        if (interpretAs === 'utf-8') {
          contents = await parseFileAsUtf8(acceptedFiles[0]);
        } else {
          contents = await parseFileAsBinary(acceptedFiles[0]);
        }
        setFieldValue(name, contents, true);
        setFieldTouched(name, true);
        setParsing(false);
      }}
      multiple={false}
      accept={acceptedFormats}
    >
      {({ getRootProps, getInputProps, acceptedFiles, rejectedFiles, isDragActive }) => {
        const status = determineStatus(acceptedFiles, rejectedFiles, error, isDragActive, parsing);
        return (
          <section>
            <div {...getRootProps({ style: dropdownDivStyle(status) })}>
              <input {...getInputProps()} />
              {
                <span style={innerSpanStyle()}>
                  <Icon name="cloud upload" size="huge" style={dropdownIconStyle()} />
                  <p>
                    {status === Status.Parsing && (
                      <>
                        <Loader style={{ marginRight: '0.5em' }} size="small" inline active /> Uploading...
                      </>
                    )}
                    {status === Status.Rejected && (
                      <>
                        {error || 'This is not a correct file!'}
                        <br />
                      </>
                    )}
                    {status === Status.Accepted && (
                      <>
                        {`Current file: ${acceptedFiles[0].name}`}
                        <br />
                      </>
                    )}
                    {status !== Status.Parsing && defaultText}
                  </p>
                </span>
              }
            </div>
          </section>
        );
      }}
    </Dropzone>
  );
}
