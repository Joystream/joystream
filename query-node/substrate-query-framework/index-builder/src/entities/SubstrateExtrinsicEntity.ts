import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { AnyJson } from '../interfaces/json-types';
import * as BN from 'bn.js';
import { NumericTransformer } from '../db/entities';
import { ExtrinsicArg, SubstrateExtrinsic } from '../interfaces';
import { SubstrateEventEntity } from './SubstrateEventEntity';

export const EXTRINSIC_TABLE_NAME = 'substrate_extrinsic'

@Entity({
  name: EXTRINSIC_TABLE_NAME
})
export class SubstrateExtrinsicEntity implements SubstrateExtrinsic {
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
    transformer: new JsonTransformer<ExtrinsicArg[]>([]), 
  })     
  args!: ExtrinsicArg[];
  
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

  @OneToOne(() => SubstrateEventEntity, (event: SubstrateEventEntity) => event.extrinsic) // specify inverse side as a second parameter
  event!: SubstrateEventEntity;
  
}