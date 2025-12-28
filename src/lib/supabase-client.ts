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

// GraphQL helper functions
export const graphql = {
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await supabase.functions.invoke('graphql', {
      body: { query, variables }
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data;
  },

  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
};

// Alternative: Direct GraphQL endpoint approach
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