import { QueryEventProcessingPack } from '.';
import { BootstrapPack } from './bootstrap';

export interface QueryNodeStartUpOptions {
  // Web socket endpoint url
  wsProviderURI: string;

  // Event processors they are defined in mappings/bootstrap
  processingPack: QueryEventProcessingPack | BootstrapPack;

  // Custum type register function
  typeRegistrator?: () => void;

  // Block number that indexer will start from, default is 0
  atBlock?: number;
}
