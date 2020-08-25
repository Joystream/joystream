import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { AnyJson } from '../utils/type-helpers';
import * as BN from 'bn.js';
import { NumericTransformer } from '../db/entities';

export interface ExtrinsicParam {
  type: string;
  name: string;
  value: AnyJson;
}

@Entity()
export class ChainExtrinsic {
  @PrimaryGeneratedColumn()
  id!: number;       
  
  @Column({
    type: 'numeric',
    transformer: new NumericTransformer(),
  })
  tip!: BN;
  
  @Column({
    type: 'numeric'
  })  
  blockNumber!: number;    
  
  @Column()     
  versionInfo!: string;  
  
  @Column({
    type: 'jsonb',
    transformer: new JsonTransformer<AnyJson>({}),
  })
  meta!: AnyJson

  @Column()
  method!: string;  
  
  @Column()      
  section!: string;     
  
  @Column({ 
    type: 'jsonb', 
    transformer: new JsonTransformer<ExtrinsicParam[]>([]), 
  })     
  params!: ExtrinsicParam[];
  
  @Column()      
  signer!: string;         
  
  @Column()      
  signature!: string;        
  
  @Column()      
  nonce!: number;            
  
  @Column({
    type: 'jsonb', 
    transformer: new JsonTransformer<AnyJson>({})
  })      
  era!: AnyJson;         
  
  @Column()      
  hash!: string;      
  
  @Column()      
  isSigned!: boolean;  
  
}