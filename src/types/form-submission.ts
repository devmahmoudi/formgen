export interface FormSubmission {
  nodeId: string;
  id: string;
  data: Record<string, any>;
  form_id: string;
  created_at: string;
  updated_at?: string;
}

export interface FormSubmissionInput {
  data: Record<string, any>;
  form_id: string;
}