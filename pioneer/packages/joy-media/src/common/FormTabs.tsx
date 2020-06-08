import React from 'react';
import { Menu, Label, Tab } from 'semantic-ui-react';
import { FormikErrors } from 'formik';
import { GenericMediaProp } from './MediaForms';

type FormTab<FormValues> = {
  id: string;
  fields?: GenericMediaProp<FormValues>[];
  renderTitle?: () => React.ReactNode;
  render?: () => React.ReactNode;
}

type FormTabsProps<FormValues> = {
  errors: FormikErrors<FormValues>;
  panes: FormTab<FormValues>[];
}

export function FormTabs <FormValues> (props: FormTabsProps<FormValues>) {
  const { panes, errors } = props;

  return <Tab
    menu={{ secondary: true, pointing: true, color: 'blue' }}
    panes={panes.map(tab => {
      const {
        id,
        fields = [],
        renderTitle = () => id,
        render = () => null
      } = tab;

      const tabErrors: any[] = [];
      fields.forEach(f => {
        const err = errors[f.id];
        if (err) {
          tabErrors.push(err);
        }
      });

      // Currently we don't show error counter because it's markup is broken:
      // a red circle with a number is shifted quite far from the right border of its tab.
      const showErrorCounter = false;

      const errCount = tabErrors.length;
      const errTooltip = 'Number of errors on this tab';

      const menuItem =
        <Menu.Item key={id}>
          {renderTitle()}
          {showErrorCounter && errCount > 0 &&
            <Label color='red' circular floating title={errTooltip}>{errCount}</Label>
          }
        </Menu.Item>;

      return { menuItem, render };
    })}
  />;
}
