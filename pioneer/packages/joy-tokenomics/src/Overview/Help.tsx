import React, { useState } from 'react';
import { Icon, Label, Transition } from 'semantic-ui-react';

type HelpProps = {help: string; className?: string; position: { left?: string; right?: string}};

export default function Help (props: HelpProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <label
      className={props.className}
      onMouseEnter={ (): void => setOpen(true) }
      onMouseLeave={ (): void => setOpen(false) }
    >
      <span style={{ position: 'absolute', display: 'inline-flex', flexWrap: 'wrap', marginTop: '-0.25em' }}>
        <Icon
          style={{ margin: '0.25em 0.1em 0.5em 0.25em' }}
          name="help circle"
          color="grey"/>
        <Transition animation="fade" visible={open} duration={500}>
          <Label basic style={{ minWidth: '15rem', position: 'absolute', ...props.position }} color="grey" content={props.help}/>
        </Transition>
      </span>
    </label>
  );
}
