import { graphqlDirect } from '@/lib/supabase-client';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class GraphQLService {
  private static instance: GraphQLService;

  private constructor() {}

  static getInstance(): GraphQLService {
    if (!GraphQLService.instance) {
      GraphQLService.instance = new GraphQLService();
    }
    return GraphQLService.instance;
  }

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      return await graphqlDirect.query<T>(query, variables);
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }

  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
    try {
      return await graphqlDirect.mutate<T>(mutation, variables);
    } catch (error) {
      console.error('GraphQL mutation error:', error);
      throw error;
    }
  }

  // Form-specific queries
  async getForms() {
    const query = `
      query GetForms {
        formsCollection {
          edges {
            node {
              id
              title
              description
              schema
              created_at
              updated_at
            }
          }
        }
      }
    `;

    const result = await this.query<{ formsCollection: any }>(query);
    return result.formsCollection?.edges?.map((edge: any) => edge.node) || [];
  }

  async getFormById(id: string) {
    const query = `
      query GetFormById($id: uuid!) {
        formsCollection(filter: { id: { eq: $id } }) {
          edges {
            node {
              id
              title
              description
              schema
              created_at
              updated_at
            }
          }
        }
      }
    `;

    const result = await this.query<{ formsCollection: any }>(query, { id });
    return result.formsCollection?.edges?.[0]?.node || null;
  }

  async createForm(formData: {
    title: string;
    description?: string | null;
    schema: any;
  }) {
    const mutation = `
      mutation CreateForm($objects: [formsInsertInput!]!) {
        insertIntoformsCollection(objects: $objects) {
          records {
            id
            title
            description
            schema
            created_at
            updated_at
          }
        }
      }
    `;

    const variables = {
      objects: [{
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    };

    const result = await this.mutate<{ insertIntoformsCollection: any }>(mutation, variables);
    return result.insertIntoformsCollection?.records?.[0] || null;
  }

  async submitFormResponse(formId: string, data: Record<string, any>) {
    const mutation = `
      mutation SubmitFormResponse($objects: [responsesInsertInput!]!) {
        insertIntoresponsesCollection(objects: $objects) {
          records {
            id
            form_id
            data
            created_at
          }
        }
      }
    `;

    const variables = {
      objects: [{
        form_id: formId,
        data: JSON.stringify(data),
        created_at: new Date().toISOString()
      }]
    };

    const result = await this.mutate<{ insertIntoresponsesCollection: any }>(mutation, variables);
    return result.insertIntoresponsesCollection?.records?.[0] || null;
  }

  async deleteForm(id: string) {
    const mutation = `
      mutation DeleteForm($id: uuid!) {
        deleteFromformsCollection(
          filter: { id: { eq: $id } }
          atMost: 1
        ) {
          records {
            id
          }
        }
      }
    `;

    const result = await this.mutate<{ deleteFromformsCollection: any }>(mutation, { id });
    return result.deleteFromformsCollection?.records?.[0] || null;
  }
}

export const graphqlService = GraphQLService.getInstance();