---
description: >-
  Interface containing the required information about the emitted Substrate
  event
---

# SubstrateEvent

The`SubstrateEvent` object is passed as the second argument for each event handler and contains all the essential information about the event being processed by Hydra Indexer. Let us take a closer look at the interface. 

```typescript
import { Extrinsic } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import * as BN from 'bn.js';

interface EventParameters {
  [key: string]: Codec;
}

export interface SubstrateEvent {
  event_name: string;
  event_method: string;
  event_params: EventParameters;
  index: BN;
  block_number: BN;
  extrinsic?: Extrinsic;
}
```

As can be seen above,  the key information about the event is encapsulated by the `Extrinsic` interface of the `@polkadot` libraries. Therefore, unfortunately, the actual data payload passed to the mappers highly depends on the event and the underlying Substrate chain. A more user-friendly and type-safe approach is in the works and will be introduced in the future versions of Hydra.

