import { graphqlDirect } from "@/lib/supabase-client";
import { supabase, supabaseHelpers } from "@/lib/supabase-client";

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

  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    try {
      return await graphqlDirect.query<T>(query, variables);
    } catch (error) {
      console.error("GraphQL query error:", error);
      throw error;
    }
  }

  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>
  ): Promise<T> {
    try {
      return await graphqlDirect.mutate<T>(mutation, variables);
    } catch (error) {
      console.error("GraphQL mutation error:", error);
      throw error;
    }
  }

  // Form-specific queries using GraphQL
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
      objects: [
        {
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    const result = await this.mutate<{ insertIntoformsCollection: any }>(
      mutation,
      variables
    );
    return result.insertIntoformsCollection?.records?.[0] || null;
  }

  async updateForm(id: string, formData: {
    title: string;
    description?: string | null;
    schema: any;
    updated_at: string;
  }) {
    const mutation = `
      mutation UpdateForm($id: uuid!, $updates: formsUpdateInput!) {
        updateformsCollection(
          filter: { id: { eq: $id } }
          set: $updates
          atMost: 1
        ) {
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
      id,
      updates: {
        title: formData.title,
        description: formData.description,
        schema: formData.schema,
        updated_at: formData.updated_at
      }
    };

    const result = await this.mutate<{ updateformsCollection: any }>(mutation, variables);
    return result.updateformsCollection?.records?.[0] || null;
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
      objects: [
        {
          form_id: formId,
          data: JSON.stringify(data),
          created_at: new Date().toISOString(),
        },
      ],
    };

    const result = await this.mutate<{ insertIntoresponsesCollection: any }>(
      mutation,
      variables
    );
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

    const result = await this.mutate<{ deleteFromformsCollection: any }>(
      mutation,
      { id }
    );
    return result.deleteFromformsCollection?.records?.[0] || null;
  }

  // New: Supabase direct queries for better JSON filtering
  async getFormResponsesWithFilters(
    formId: string,
    filters: Record<string, { operator: string; value: any }>,
    page: number = 1,
    pageSize: number = 10
  ) {
    try {
      let query = supabase
        .from("responses")
        .select("*", { count: "exact" })
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

      // Apply JSON filters
      Object.entries(filters).forEach(([fieldName, filter]) => {
        if (
          filter.value !== "" &&
          filter.value !== null &&
          filter.value !== undefined &&
          filter.value !== false
        ) {
          // Determine if we should use text extraction (->>) or JSONB (->)
          // For text-based searches (contains, startsWith, endsWith, string equals)
          // we need to use ->> to extract as text
          const isTextSearch =
            filter.operator === "contains" ||
            filter.operator === "startsWith" ||
            filter.operator === "endsWith" ||
            (filter.operator === "equals" && typeof filter.value === "string");

          const jsonPath = isTextSearch
            ? `data->>${fieldName}`
            : `data->${fieldName}`;

          console.log(`Filtering ${fieldName}:`, {
            operator: filter.operator,
            value: filter.value,
            valueType: typeof filter.value,
            jsonPath: jsonPath,
          });

          // For text fields with contains, use ilike for case-insensitive search
          if (filter.operator === "contains") {
            query = query.filter(jsonPath, "ilike", `%${filter.value}%`);
          }
          // For exact matches
          else if (filter.operator === "equals") {
            // For string values, we need to use the string directly
            // For boolean/number values, they work as-is
            query = query.filter(jsonPath, "eq", filter.value);
          }
          // For boolean checks
          else if (filter.operator === "isTrue") {
            query = query.filter(jsonPath, "eq", true);
          } else if (filter.operator === "isFalse") {
            query = query.filter(jsonPath, "eq", false);
          }
          // For number comparisons
          else if (filter.operator === "greaterThan") {
            query = query.filter(jsonPath, "gt", filter.value);
          } else if (filter.operator === "lessThan") {
            query = query.filter(jsonPath, "lt", filter.value);
          }
          // For starts with
          else if (filter.operator === "startsWith") {
            query = query.filter(jsonPath, "ilike", `${filter.value}%`);
          }
          // For ends with
          else if (filter.operator === "endsWith") {
            query = query.filter(jsonPath, "ilike", `%${filter.value}`);
          }
          // For greater than or equal
          else if (filter.operator === "greaterThanOrEqual") {
            query = query.filter(jsonPath, "gte", filter.value);
          }
          // For less than or equal
          else if (filter.operator === "lessThanOrEqual") {
            query = query.filter(jsonPath, "lte", filter.value);
          }
        }
      });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Supabase filter error:", error);
        throw new Error(error.message);
      }

      console.log("Filter results:", {
        total: count,
        returned: data?.length,
        filtersApplied: Object.keys(filters).length,
      });

      return {
        responses: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error: any) {
      console.error("Error fetching responses:", error);
      throw error;
    }
  }

  // Backward compatibility method
  async getFormResponses(formId: string) {
    const { data, error } = await supabase
      .from("responses")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async deleteResponse(responseId: string) {
    const mutation = `
    mutation DeleteResponse($id: uuid!) {
      deleteFromresponsesCollection(
        filter: { id: { eq: $id } }
        atMost: 1
      ) {
        records {
          id
        }
      }
    }
  `;

    const result = await this.mutate<{ deleteFromresponsesCollection: any }>(
      mutation,
      { id: responseId }
    );
    return result.deleteFromresponsesCollection?.records?.[0] || null;
  }

  // Also add a Supabase direct delete method for better performance
  async deleteResponseDirect(responseId: string) {
    const { data, error } = await supabase
      .from("responses")
      .delete()
      .eq("id", responseId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const graphqlService = GraphQLService.getInstance();