interface JoinTable {
  tableName: string;
  joinColumn: string;
  inverseJoinColumn: string;
}

export interface Relation {
  // Relation type oto, otm, mtm
  type: string;

  // Column type
  columnType: string;

  // Table that will hold relation id (foreign key)
  joinColumn?: boolean;

  joinTable?: JoinTable;

  relatedTsProp?: string;
}
