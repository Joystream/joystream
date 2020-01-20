import React from 'react';
import { Menu, Label } from 'semantic-ui-react';
import { FormikErrors } from 'formik';
import { GenericMediaProp } from './MediaForms';

type TabMetaItem<FormValues> = {
  title: string,
  fieldIds: (keyof FormValues)[],
}

type TabsMeta<FormValues> = {
  [tabId: string]: TabMetaItem<FormValues>
};

type TabToFieldsMap<FormValues> = {
  [tabName: string]: GenericMediaProp<FormValues>[]
};

export function newTabsMeta <FormValues> (tabs: TabToFieldsMap<FormValues>): TabsMeta<FormValues> {
  const res = {} as TabsMeta<FormValues>;
  Object.keys(tabs).forEach(title => {
    res[title] = {
      title,
      fieldIds: tabs[title].map(f => f.id)
    };
  });
  return res;
};

export function newTabMenuItemRenderer <FormValues> (tabsMeta: TabsMeta<FormValues>, errors: FormikErrors<FormValues>) {

  return (tabName: string) => {
    const tab = tabsMeta[tabName];
    if (!tab) {
      return null;
    }
  
    const tabErrors: any[] = [];
    tab.fieldIds.forEach(f => {
      const err = errors[f];
      if (err) {
        tabErrors.push(err);
      }
    })
  
    const errCount = tabErrors.length;
    const { title } = tab;
  
    return (
      <Menu.Item key={title}>
        {title}
        {errCount > 0 && <Label color='red' circular floating title='Number of errors on this tab'>{errCount}</Label>}
      </Menu.Item>
    );
  };
};
