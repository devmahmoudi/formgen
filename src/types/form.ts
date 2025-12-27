export interface Form {
  nodeId: string;
  id: string;
  title: string;
  description: string | null;
  schema: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FormEdge {
  node: Form;
}

export interface FormsCollection {
  edges: FormEdge[];
}

export interface FormListResponse {
  formsCollection: FormsCollection;
}