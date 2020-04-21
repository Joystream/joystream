import React, { useState } from "react";
import { FormikProps } from "formik";
import { Icon, Loader } from "semantic-ui-react";
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
}

// Get color by status (imporant to use #FFFFFF format, so we can easily swicth the opacity!)
const getStatusColor = (status:Status): string => {
  switch(status) {
    case Status.Accepted: return '#00DBB0';
    case Status.Rejected: return '#FF3861';
    case Status.Active:
    case Status.Parsing:
      return '#000000';
    default: return '#333333';
  }
}

const dropdownDivStyle = (status:Status): React.CSSProperties => {
  let mainColor = getStatusColor(status);

  return {
    cursor: 'pointer',
    border: `1px solid ${ mainColor + '30' }`,
    borderRadius: '3px',
    padding: '1.5em',
    color: mainColor,
    fontWeight: 'bold',
    transition: 'color 0.5s, border-color 0.5s'
  };
}

const dropdownIconStyle = (): React.CSSProperties => {
  return {
    marginRight: '0.5em',
    opacity: 0.5
  };
}

const innerSpanStyle = (): React.CSSProperties => {
  return {
    display: 'flex',
    alignItems: 'center'
  };
}

// Here we define a way of coverting the file into string for Formik purposes
// This may change depnding on how we decide to actually send the data
const parseFile = async (file: File): Promise<string> => {
  return await file.text();
}

type FileDropdownProps<FormValuesT> = {
  error: string | undefined,
  name: keyof FormValuesT & string,
  setFieldValue: FormikProps<FormValuesT>["setFieldValue"],
  acceptedFormats: string | string[],
  defaultText: string
}

export default function FileDropdown<ValuesT = {}>(props: FileDropdownProps<ValuesT>) {
  const [ parsing, setParsing ] = useState(false);
  const { error, name, setFieldValue, acceptedFormats, defaultText } = props;
  return (
    <Dropzone
      onDropAccepted={ async(acceptedFiles) => {
        setParsing(true);
        const fileAsString:string = await parseFile(acceptedFiles[0]);
        setFieldValue(name, fileAsString, true);
        setParsing(false);
      } }
      multiple={false}
      accept={acceptedFormats}
      >
      {({ getRootProps, getInputProps, acceptedFiles, rejectedFiles, isDragActive }) => {
        const status = determineStatus(acceptedFiles, rejectedFiles, error, isDragActive, parsing);
        return (
          <section>
            <div {...getRootProps({ style: dropdownDivStyle(status) })}>
              <input {...getInputProps()}/>
              {
                <span style={ innerSpanStyle() }>
                    <Icon name="cloud upload" size="huge" style={ dropdownIconStyle() }/>
                    <p>
                      { status === Status.Parsing && <><Loader style={{marginRight: '0.5em'}} size="small" inline active/> Uploading...</> }
                      { status === Status.Rejected && (<>{ error || 'This is not a correct file!'}<br/></>) }
                      { status === Status.Accepted && (<>{`Current file: ${ acceptedFiles[0].name }`}<br/></>) }
                      { status !== Status.Parsing && defaultText }
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
