export type FieldType = "text" | "email" | "number" | "textarea" | "select" | "checkbox";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}