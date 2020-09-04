import { QueryEventProcessingPack } from '.';
import { BootstrapPack } from './bootstrap';

export type QueryNodeStartUpOptions = IndexerOptions | ProcessorOptions | BootstrapOptions;

export interface IndexerOptions  {
  atBlock?: number;
  typeRegistrator?: () => void;
  wsProviderURI: string;
}

export interface ProcessorOptions {
  processingPack: QueryEventProcessingPack
  atBlock?: number;
}

export interface BootstrapOptions {
  atBlock?: number;
  typeRegistrator?: () => void;
  wsProviderURI: string;
  processingPack: BootstrapPack
}