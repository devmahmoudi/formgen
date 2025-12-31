import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  Copy,
  Eye,
  FileText,
  History,
  Mail,
  CheckSquare,
  Clock,
  Hash,
  Type,
  Radio,
  ChevronRight,
  Pencil,
  Trash2,
  Link,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService, type FormResponse } from "@/services/supabase.service";
import { Label } from "@/components/ui/label";
import DeleteResponseConfirmation from "@/components/delete-response-confirmation";

interface FormField {
  id: string;
  type: string;
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

interface RelatedFormData {
  [formId: string]: {
    [responseId: string]: {
      displayValue: string;
      data: Record<string, any>;
    };
  };
}

interface FieldValueDisplay {
  label: string;
  value: any;
  type: string;
  icon: React.ReactNode;
  formattedValue: string;
  field: FormField;
}

export default function ShowResponse() {
  const { formId, responseId } = useParams<{ formId: string; responseId: string }>();
  const navigate = useNavigate();

  const [responseData, setResponseData] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [formNotFound, setFormNotFound] = useState(false);
  const [responseNotFound, setResponseNotFound] = useState(false);
  const [responseCreatedAt, setResponseCreatedAt] = useState("");
  const [responseUpdatedAt, setResponseUpdatedAt] = useState("");
  const [fieldValues, setFieldValues] = useState<FieldValueDisplay[]>([]);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<FormResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Relation field data
  const [relatedFormData, setRelatedFormData] = useState<RelatedFormData>({});
  const [loadingRelations, setLoadingRelations] = useState(false);

  // Update field values when fields or responseData changes
  useEffect(() => {
    if (fields.length > 0 && Object.keys(responseData).length > 0) {
      const displayValues: FieldValueDisplay[] = fields.map((field) => {
        const value = responseData[field.id];
        let formattedValue = "";
        let icon = <Type className="w-4 h-4" />;

        switch (field.type) {
          case "text":
          case "textarea":
            formattedValue = value || "Not provided";
            icon = <FileText className="w-4 h-4" />;
            break;
          case "email":
            formattedValue = value || "Not provided";
            icon = <Mail className="w-4 h-4" />;
            break;
          case "number":
            formattedValue = value !== undefined && value !== "" ? value.toString() : "Not provided";
            icon = <Hash className="w-4 h-4" />;
            break;
          case "select":
          case "dropdown":
            formattedValue = value || "Not selected";
            icon = <ChevronRight className="w-4 h-4" />;
            break;
          case "radio":
            formattedValue = value || "Not selected";
            icon = <Radio className="w-4 h-4" />;
            break;
          case "checkbox":
            formattedValue = value ? "Yes" : "No";
            icon = <CheckSquare className="w-4 h-4" />;
            break;
          case "date":
            formattedValue = value ? new Date(value).toLocaleDateString() : "Not provided";
            icon = <Calendar className="w-4 h-4" />;
            break;
          case "relation":
            formattedValue = value || "Not selected";
            icon = <Link className="w-4 h-4" />;
            break;
          default:
            formattedValue = value || "Not provided";
        }

        return {
          label: field.label,
          value,
          type: field.type,
          icon,
          formattedValue,
          field
        };
      });

      setFieldValues(displayValues);
    }
  }, [fields, responseData]);

  // Fetch form schema and response data
  useEffect(() => {
    if (!formId || !responseId) {
      setFormNotFound(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setFormNotFound(false);
      setResponseNotFound(false);

      try {
        console.log('Fetching data for formId:', formId, 'responseId:', responseId);

        // Try to fetch form with different ID formats
        let form = null;
        let fetchedFormId = formId;

        // First try with string ID
        form = await supabaseService.getFormById(formId);
        
        // If not found and ID is numeric, try with number
        if (!form && !isNaN(Number(formId))) {
          form = await supabaseService.getFormById(Number(formId));
          if (form) {
            fetchedFormId = form.id.toString();
          }
        }

        if (!form) {
          console.error('Form not found with ID:', formId);
          setFormNotFound(true);
          toast.error("Form not found");
          return;
        }

        console.log('Form found:', form);
        setFormTitle(form.title || "");
        setFormDescription(form.description || "");

        // Parse form schema to get fields
        let parsedFields: FormField[] = [];
        try {
          let schema = form.schema;
          if (typeof schema === "string") {
            schema = JSON.parse(schema);
          }

          if (schema && typeof schema === "object" && "fields" in schema) {
            parsedFields = schema.fields || [];
          }
        } catch (parseError) {
          console.error("Error parsing schema:", parseError);
          toast.error("Error loading form structure");
        }
        console.log('Parsed fields:', parsedFields);
        setFields(parsedFields);

        // Try to fetch response with different ID formats
        let response = null;

        // First try with string ID
        response = await supabaseService.getResponseById(responseId);
        
        // If not found and ID is numeric, try with number
        if (!response && !isNaN(Number(responseId))) {
          response = await supabaseService.getResponseById(Number(responseId));
        }

        if (!response) {
          console.error('Response not found with ID:', responseId);
          setResponseNotFound(true);
          toast.error("Response not found");
          return;
        }

        console.log('Response found:', response);

        // Check if response belongs to the form (compare as strings)
        const responseFormId = response.form_id.toString();
        const currentFormId = fetchedFormId.toString();
        
        console.log('Comparing form IDs - response.form_id:', responseFormId, 'currentFormId:', currentFormId);
        
        if (responseFormId !== currentFormId) {
          console.error('Response does not belong to this form');
          toast.error("Response does not belong to this form");
          setResponseNotFound(true);
          return;
        }

        setResponseCreatedAt(response.created_at);
        setResponseUpdatedAt(response.updated_at || response.created_at);

        let data: Record<string, any> = {};
        try {
          // In Supabase, data is already an object
          data = response.data || {};
          console.log('Response data:', data);
        } catch (error) {
          console.error("Error parsing response data:", error);
          data = {};
        }

        setResponseData(data);

        // Fetch related form data for relation fields
        await fetchRelatedFormData(parsedFields, data);

      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error(`Error loading data: ${error.message}`);
        setFormNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId, responseId]);

  // Fetch related form data for relation fields
  const fetchRelatedFormData = async (fields: FormField[], currentData: Record<string, any>) => {
    const relationFields = fields.filter(f => f.type === 'relation' && f.relationConfig?.formId);
    
    if (relationFields.length === 0) return;
    
    setLoadingRelations(true);
    
    try {
      const newRelatedFormData: RelatedFormData = {};
      
      for (const field of relationFields) {
        const relatedFormId = field.relationConfig!.formId!;
        
        // Only fetch if we haven't already fetched this form's data
        if (!newRelatedFormData[relatedFormId]) {
          const responses = await supabaseService.getFormResponses(relatedFormId);
          
          const relatedForm = await supabaseService.getFormById(relatedFormId);
          let relatedFormFields: FormField[] = [];
          
          if (relatedForm && relatedForm.schema) {
            try {
              let schema = relatedForm.schema;
              if (typeof schema === 'string') {
                schema = JSON.parse(schema);
              }
              if (schema && schema.fields) {
                relatedFormFields = schema.fields;
              }
            } catch (error) {
              console.error("Error parsing related form schema:", error);
            }
          }
          
          // Create a mapping of response ID to display value
          const formData: RelatedFormData[string] = {};
          
          responses.forEach((response: any) => {
            let data: Record<string, any> = {};
            try {
              data = response.data || {};
            } catch (error) {
              console.error("Error parsing related response data:", error);
            }

            // Get display value
            let displayValue = `Response ${response.id?.toString()?.substring(0, 8) || 'Unknown'}...`;
            
            if (field.relationConfig?.displayField && data[field.relationConfig.displayField]) {
              displayValue = String(data[field.relationConfig.displayField]);
            } else {
              // Fallback: find any text field
              const textField = relatedFormFields.find(f => 
                ['text', 'email', 'textarea'].includes(f.type)
              );
              if (textField && data[textField.id]) {
                displayValue = String(data[textField.id]);
              }
            }
            
            formData[response.id] = {
              displayValue,
              data
            };
          });

          newRelatedFormData[relatedFormId] = formData;
        }
      }
      
      setRelatedFormData(newRelatedFormData);
      
    } catch (error) {
      console.error("Error fetching related form data:", error);
    } finally {
      setLoadingRelations(false);
    }
  };

  // Get display value for a relation field
  const getRelationDisplayValue = (field: FormField, value: string | number | undefined): string => {
    if (!value) return "Not selected";
    
    if (field.relationConfig?.formId) {
      const formData = relatedFormData[field.relationConfig.formId];
      if (!formData) return `Loading... (ID: ${value.toString().substring(0, 8)}...)`;
      
      const responseData = formData[value];
      
      if (responseData) {
        return responseData.displayValue;
      }
      
      return `ID: ${value.toString().substring(0, 8)}...`;
    }
    
    return `ID: ${value.toString().substring(0, 8)}...`;
  };

  const handleCopyToClipboard = () => {
    const textToCopy = JSON.stringify(responseData, null, 2);
    navigator.clipboard.writeText(textToCopy);
    toast.success("Response data copied to clipboard!");
  };

  const handleEdit = () => {
    navigate(`/form/${formId}/responses/edit/${responseId}`);
  };

  // Handle delete button click
  const handleDeleteClick = async () => {
    try {
      // Fetch the response to show in confirmation dialog
      let response = await supabaseService.getResponseById(responseId!);
      
      // If not found with string ID, try numeric ID
      if (!response && !isNaN(Number(responseId))) {
        response = await supabaseService.getResponseById(Number(responseId!));
      }
      
      if (response) {
        setResponseToDelete(response);
        setShowDeleteDialog(true);
      } else {
        toast.error("Could not load response for deletion");
      }
    } catch (error) {
      console.error("Error loading response for deletion:", error);
      toast.error("Error loading response");
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!responseToDelete) return;
    
    setDeleting(true);
    try {
      await supabaseService.deleteResponse(responseToDelete.id);
      toast.success("Response deleted successfully");
      navigate(`/form/${formId}/responses`);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete response: ${error.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setResponseToDelete(null);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setResponseToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getValueDisplay = (field: FieldValueDisplay) => {
    if (field.value === undefined || field.value === null || field.value === "") {
      return <span className="text-muted-foreground italic">{field.formattedValue}</span>;
    }

    switch (field.type) {
      case "email":
        return (
          <a 
            href={`mailto:${field.value}`}
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {field.value}
            <Mail className="w-3 h-3" />
          </a>
        );
      case "checkbox":
        return (
          <Badge variant={field.value ? "default" : "outline"} className="gap-1">
            {field.value ? (
              <>
                <CheckSquare className="w-3 h-3" />
                Yes
              </>
            ) : (
              "No"
            )}
          </Badge>
        );
      case "textarea":
        return (
          <div className="bg-muted p-3 rounded-md whitespace-pre-wrap font-mono text-sm">
            {field.value}
          </div>
        );
      case "relation":
        const displayValue = getRelationDisplayValue(field.field, field.value);
        const isLoading = displayValue.includes("Loading");
        
        return (
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-muted-foreground italic">{displayValue}</span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{displayValue}</span>
                </div>
                {field.field.relationConfig?.formId && (
                  <Badge variant="outline" className="text-xs">
                    {field.field.relationConfig.formTitle || "Related Form"}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    if (field.field.relationConfig?.formId) {
                      navigate(`/form/${field.field.relationConfig.formId}/responses/show/${field.value}`);
                    }
                  }}
                  disabled={isLoading}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        );
      default:
        return <span className="font-medium">{field.formattedValue}</span>;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "text": return <Type className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "number": return <Hash className="w-4 h-4" />;
      case "textarea": return <FileText className="w-4 h-4" />;
      case "select": 
      case "dropdown": return <ChevronRight className="w-4 h-4" />;
      case "radio": return <Radio className="w-4 h-4" />;
      case "checkbox": return <CheckSquare className="w-4 h-4" />;
      case "date": return <Calendar className="w-4 h-4" />;
      case "relation": return <Link className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-8 w-64" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (formNotFound || responseNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {formNotFound ? "Form Not Found" : "Response Not Found"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {formNotFound 
                ? "The form doesn't exist or has been removed."
                : "The response doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate("/form")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forms List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/form/${formId}/responses`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Responses
            </Button>
            
            <Badge variant="outline" className="gap-1">
              <Eye className="w-3 h-3" />
              View Only
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Response Details</h1>
              <p className="text-muted-foreground">
                Viewing response for: <span className="font-semibold">{formTitle}</span>
              </p>
              {formDescription && (
                <p className="text-sm text-muted-foreground mt-1">{formDescription}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Response Metadata */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Submitted:</span>
                  </div>
                  <p className="text-sm">{formatDate(responseCreatedAt)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <History className="w-4 h-4" />
                    <span className="font-medium">Last Updated:</span>
                  </div>
                  <p className="text-sm">{formatDate(responseUpdatedAt)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Response ID:</span>
                  </div>
                  <p className="text-sm font-mono break-all">{responseId}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Fields Completed:</span>
                  </div>
                  <p className="text-sm">
                    {fieldValues.filter(f => f.value !== undefined && f.value !== null && f.value !== "").length} of {fieldValues.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Data */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Response Data</CardTitle>
            <CardDescription>
              All submitted form field values
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {fieldValues.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Form Fields</h3>
                <p className="text-muted-foreground">
                  This form doesn't have any fields or fields couldn't be loaded.
                </p>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm font-mono">Available data fields:</p>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {fieldValues.map((field, index) => (
                  <div key={`${field.label}-${index}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIconForType(field.type)}
                        <Label className="text-sm font-medium">
                          {field.label}
                        </Label>
                        {field.field.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                        {field.type === 'relation' && field.field.relationConfig?.formTitle && (
                          <span className="ml-1">({field.field.relationConfig.formTitle})</span>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="pl-6">
                      {getValueDisplay(field)}
                    </div>
                    
                    {index < fieldValues.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* JSON Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Raw JSON Data</CardTitle>
            <CardDescription>
              Complete response data in JSON format
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px] font-mono">
                {JSON.stringify(responseData, null, 2)}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleCopyToClipboard}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Footer */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            <p>Response ID: {responseId?.substring(0, 12)}...</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/form/${formId}/responses`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Responses
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleEdit}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Response
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteResponseConfirmation
        response={responseToDelete}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}