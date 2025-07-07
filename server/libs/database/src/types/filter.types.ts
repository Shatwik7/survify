export type Condition = {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
  value: string | number | boolean;
};

export type FilterGroup = {
  logic: 'AND' | 'OR';
  conditions: (Condition | FilterGroup)[];
};
