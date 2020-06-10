import React, { useState } from 'react';
import { Icon, Label, Transition } from 'semantic-ui-react';

type LabelWithHelpProps = { text: string; help: string };

export default function LabelWithHelp (props: LabelWithHelpProps) {
  const [open, setOpen] = useState(false);
  return (
    <label
      style={{ position: 'relative', cursor: 'pointer', padding: '0.25em 0' }}
      onMouseEnter={ () => setOpen(true) }
      onMouseLeave={ () => setOpen(false) }
    >
      {props.text}
      <span style={{ position: 'absolute', display: 'inline-flex', flexWrap: 'wrap', marginTop: '-0.25em' }}>
        <Icon
          style={{ margin: '0.25em 0.1em 0.5em 0.25em' }}
          name="help circle"
          color="grey"/>
        <Transition animation="fade" visible={open} duration={500}>
          <Label basic style={{ minWidth: '150px' }} color="grey" content={props.help}/>
        </Transition>
      </span>
    </label>
  );
}
