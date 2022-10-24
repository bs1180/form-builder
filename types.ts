interface BaseField {
  name: string;
  type: FieldType;
  defaultVisibility: boolean;
  validationRules: ValidationRule[];
  conditionalRules: ConditionalRule[];
}

export interface ValidationRule {
  (value: any): string | undefined;
}

export interface ConditionalRule {
  (values: Record<string, string | boolean>): boolean;
}

interface TextField extends BaseField {
  type: "text";
  value: string;
}

interface BooleanField extends BaseField {
  type: "boolean";
  value: boolean;
}

interface SelectField extends BaseField {
  type: "select";
  options: string[];
  value: string;
}

type Field = TextField | BooleanField | SelectField;

export type FieldType = "text" | "select" | "boolean";

export interface Form {
  name: string;
  fields: Field[];
}
