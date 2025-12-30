// types.ts
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'date'
  | 'relation'; // Add this

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  relationConfig?: {
    formId?: string;
    formTitle?: string;
    displayField?: string;
  };
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}