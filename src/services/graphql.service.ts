import { graphqlDirect } from "@/lib/supabase-client";
import { supabase, supabaseHelpers } from "@/lib/supabase-client";

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class GraphQLService {
  private static instance: GraphQLService;
  private formsCache: any[] = [];

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

  // Helper method to fetch all forms with caching
  private async getAllForms(): Promise<any[]> {
    if (this.formsCache.length > 0) {
      return this.formsCache;
    }
    
    try {
      const forms = await this.getForms();
      this.formsCache = forms;
      return forms;
    } catch (error) {
      console.error("Error fetching forms for relation:", error);
      return [];
    }
  }

  // Helper method to process relation fields
  private async processRelationFields(formData: any): Promise<any> {
    // Create a deep copy to avoid mutating the original
    const processedData = JSON.parse(JSON.stringify(formData));
    
    try {
      // Parse schema if it's a string
      let schema = processedData.schema;
      if (typeof schema === 'string') {
        try {
          schema = JSON.parse(schema);
        } catch (e) {
          console.error("Error parsing schema:", e);
          return processedData;
        }
      }
      
      // Check if schema has fields
      if (!schema || typeof schema !== 'object' || !Array.isArray(schema.fields)) {
        return processedData;
      }
      
      // Get all forms to resolve relation field titles
      const allForms = await this.getAllForms();
      
      // Process each field
      schema.fields = schema.fields.map((field: any) => {
        if (field.type === 'relation' && field.relationConfig?.formId) {
          // Find the related form
          const relatedForm = allForms.find(f => f.id === field.relationConfig.formId);
          
          if (relatedForm) {
            // Update relation config with form title
            field.relationConfig = {
              ...field.relationConfig,
              formTitle: relatedForm.title || "Untitled Form"
            };
            
            // Ensure displayField and valueField are properly set
            if (!field.relationConfig.displayField) {
              // Try to find a suitable display field from the related form
              let relatedSchema = relatedForm.schema;
              if (typeof relatedSchema === 'string') {
                try {
                  relatedSchema = JSON.parse(relatedSchema);
                } catch (e) {
                  console.error("Error parsing related form schema:", e);
                }
              }
              
              if (relatedSchema?.fields?.[0]?.id) {
                field.relationConfig.displayField = relatedSchema.fields[0].id;
              }
            }
            
            if (!field.relationConfig.valueField) {
              // Default to response ID
              field.relationConfig.valueField = 'id';
            }
          } else {
            console.warn(`Related form not found: ${field.relationConfig.formId}`);
            // Keep the relation config but mark as invalid
            field.relationConfig.formTitle = "Form not found";
          }
        }
        return field;
      });
      
      // Update the processed data with modified schema
      processedData.schema = JSON.stringify(schema);
      return processedData;
      
    } catch (error) {
      console.error("Error processing relation fields:", error);
      return processedData;
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
    const forms = result.formsCollection?.edges?.map((edge: any) => edge.node) || [];
    
    // Update cache
    this.formsCache = forms;
    
    return forms;
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
    try {
      // Process relation fields before saving
      const processedFormData = await this.processRelationFields(formData);
      
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
            title: processedFormData.title,
            description: processedFormData.description || null,
            schema: processedFormData.schema,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };

      const result = await this.mutate<{ insertIntoformsCollection: any }>(
        mutation,
        variables
      );
      
      const createdForm = result.insertIntoformsCollection?.records?.[0] || null;
      
      if (createdForm) {
        // Invalidate forms cache since we added a new form
        this.formsCache = [];
        console.log("Form created successfully with processed relation fields");
      }
      
      return createdForm;
      
    } catch (error: any) {
      console.error("Error creating form:", error);
      throw error;
    }
  }

  async updateForm(id: string, formData: {
    title: string;
    description?: string | null;
    schema: any;
    updated_at: string;
  }) {
    try {
      // Process relation fields before updating
      const processedFormData = await this.processRelationFields(formData);
      
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
          title: processedFormData.title,
          description: processedFormData.description || null,
          schema: processedFormData.schema,
          updated_at: processedFormData.updated_at
        }
      };

      const result = await this.mutate<{ updateformsCollection: any }>(mutation, variables);
      
      const updatedForm = result.updateformsCollection?.records?.[0] || null;
      
      if (updatedForm) {
        // Invalidate forms cache since we updated a form
        this.formsCache = [];
        console.log("Form updated successfully with processed relation fields");
      }
      
      return updatedForm;
      
    } catch (error: any) {
      console.error("Error updating form:", error);
      throw error;
    }
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
    
    // Invalidate forms cache since we deleted a form
    this.formsCache = [];
    
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

  // Get responses for a specific form with pagination
  async getFormResponsesPaginated(formId: string, page: number = 1, pageSize: number = 50) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("responses")
      .select("*", { count: "exact" })
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      responses: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async getResponseById(responseId: string) {
    const query = `
      query GetResponseById($id: uuid!) {
        responsesCollection(filter: { id: { eq: $id } }) {
          edges {
            node {
              id
              form_id
              data
              created_at
              updated_at
            }
          }
        }
      }
    `;

    const result = await this.query<{ responsesCollection: any }>(query, { id: responseId });
    return result.responsesCollection?.edges?.[0]?.node || null;
  }

  async updateResponse(responseId: string, data: Record<string, any>) {
    const mutation = `
      mutation UpdateResponse($id: uuid!, $updates: responsesUpdateInput!) {
        updateresponsesCollection(
          filter: { id: { eq: $id } }
          set: $updates
          atMost: 1
        ) {
          records {
            id
            form_id
            data
            created_at
            updated_at
          }
        }
      }
    `;

    const variables = {
      id: responseId,
      updates: {
        data: JSON.stringify(data),
        updated_at: new Date().toISOString()
      }
    };

    const result = await this.mutate<{ updateresponsesCollection: any }>(mutation, variables);
    return result.updateresponsesCollection?.records?.[0] || null;
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