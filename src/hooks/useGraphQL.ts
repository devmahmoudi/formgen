import { useState, useCallback } from 'react';
import { graphqlService } from '@/services/graphql.service';

export function useGraphQL<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const executeQuery = useCallback(async (
    query: string, 
    variables?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await graphqlService.query<T>(query, variables);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeMutation = useCallback(async (
    mutation: string, 
    variables?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await graphqlService.mutate<T>(mutation, variables);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    executeQuery,
    executeMutation,
    reset: () => {
      setLoading(false);
      setError(null);
      setData(null);
    }
  };
}

// Form-specific hooks
export function useForms() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await graphqlService.getForms();
      setForms(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteForm = useCallback(async (id: string) => {
    try {
      await graphqlService.deleteForm(id);
      setForms(prev => prev.filter(form => form.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    forms,
    loading,
    error,
    fetchForms,
    deleteForm,
    refetch: fetchForms
  };
}

export function useFormSubmission() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = useCallback(async (formId: string, data: Record<string, any>) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const result = await graphqlService.submitFormResponse(formId, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    error,
    submitForm
  };
}