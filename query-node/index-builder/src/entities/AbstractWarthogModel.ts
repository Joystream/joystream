import { Column, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

/**
 * Abstract class with Warthog fields. All Entities exposed as warthog model class
 * should extend it.
 */
export abstract class AbstractWarthogModel {
      // Warthog Fields
  @CreateDateColumn() 
  createdAt!: Date;
  @Column({
    default: 'hydra-indexer'
  }) 
  createdById!: string;
  
  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;
  
  @Column({ 
    nullable: true 
  })
  updatedById?: string;
  
  @Column({ nullable: true })
  deletedAt?: Date;
  
  @Column({ nullable: true })
  deletedById?: string;
  
  @VersionColumn() 
  version!: number;
}