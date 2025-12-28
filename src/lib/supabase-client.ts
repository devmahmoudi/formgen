import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_GRAPH_QL_API;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    }
  }
});

// Helper functions for JSON querying
export const supabaseHelpers = {
  // Build JSON query based on field type and filter
  buildJsonQuery(fieldName: string, fieldType: string, filter: { operator: string; value: any }) {
    const path = fieldType === 'text' || fieldType === 'email' || fieldType === 'textarea'
      ? `data->>${fieldName}`  // Text extraction
      : `data->${fieldName}`;  // JSONB for numbers, booleans, etc.

    switch (filter.operator) {
      case 'equals':
        return `${path}.eq.${filter.value}`;
      case 'contains':
        return `${path}.ilike.%${filter.value}%`;
      case 'greaterThan':
        return `${path}.gt.${filter.value}`;
      case 'lessThan':
        return `${path}.lt.${filter.value}`;
      case 'isTrue':
        return `${path}.is.true`;
      case 'isFalse':
        return `${path}.is.false`;
      default:
        return `${path}.eq.${filter.value}`;
    }
  },

  // Get appropriate filter operator based on field type
  getDefaultOperator(fieldType: string): string {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'textarea':
        return 'contains';
      case 'number':
        return 'equals';
      case 'checkbox':
        return 'isTrue';
      default:
        return 'equals';
    }
  },

  // Parse filter value based on field type
  parseFilterValue(fieldType: string, value: string): any {
    if (fieldType === 'number') {
      return Number(value);
    }
    if (fieldType === 'checkbox') {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return null;
    }
    return value;
  }
};

// Direct GraphQL endpoint helper (for backward compatibility)
export const graphqlDirect = {
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const { data, errors } = await response.json();
    
    if (errors && errors.length > 0) {
      throw new Error(errors.map((e: any) => e.message).join(', '));
    }
    
    return data;
  },

  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
};