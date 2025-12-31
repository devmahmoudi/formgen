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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ArrowLeft,
  CheckCircle,
  Send,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Link,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { supabaseService } from "@/services/supabase.service";

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

interface RelatedResponse {
  id: string;
  data: Record<string, any>;
  created_at: string;
  displayValue: string;
  formId: string;
}

export default function EditResponse() {
  const { formId, responseId } = useParams<{ formId: string; responseId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUpdated, setIsUpdated] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formNotFound, setFormNotFound] = useState(false);
  const [responseNotFound, setResponseNotFound] = useState(false);
  const [relatedResponses, setRelatedResponses] = useState<
    Record<string, RelatedResponse[]>
  >({});
  const [loadingRelations, setLoadingRelations] = useState<
    Record<string, boolean>
  >({});

  // Fetch form schema, response data, and related data
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
        // Fetch form details
        let form = await supabaseService.getFormById(formId);
        
        // If not found with string ID, try numeric ID
        if (!form && !isNaN(Number(formId))) {
          form = await supabaseService.getFormById(Number(formId));
        }

        if (!form) {
          setFormNotFound(true);
          toast.error("Form not found");
          return;
        }

        setFormTitle(form.title || "");
        setFormDescription(form.description || "");

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

        setFields(parsedFields);

        // Fetch response data
        let response = await supabaseService.getResponseById(responseId);
        
        // If not found with string ID, try numeric ID
        if (!response && !isNaN(Number(responseId))) {
          response = await supabaseService.getResponseById(Number(responseId));
        }

        if (!response) {
          setResponseNotFound(true);
          toast.error("Response not found");
          return;
        }

        // Check if response belongs to the form (compare as strings)
        const responseFormId = response.form_id.toString();
        const currentFormId = formId.toString();
        
        if (responseFormId !== currentFormId) {
          toast.error("Response does not belong to this form");
          setResponseNotFound(true);
          return;
        }

        let data: Record<string, any> = {};
        try {
          // In Supabase, data is already an object
          data = response.data || {};
        } catch (error) {
          console.error("Error parsing response data:", error);
          data = {};
        }

        // Initialize form data with response values
        const initialData: Record<string, any> = {};
        parsedFields.forEach((field: FormField) => {
          const value = data[field.id];
          switch (field.type) {
            case "checkbox":
              initialData[field.id] = value || false;
              break;
            case "select":
            case "radio":
            case "relation":
              initialData[field.id] = value || "";
              break;
            default:
              initialData[field.id] = value || "";
          }
        });
        setFormData(initialData);

        // Fetch related responses for relation fields
        await fetchRelatedResponses(parsedFields, data);

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

  const fetchRelatedResponses = async (fields: FormField[], currentData: Record<string, any>) => {
    const relationFields = fields.filter(
      (f) => f.type === "relation" && f.relationConfig?.formId
    );

    for (const field of relationFields) {
      setLoadingRelations((prev) => ({ ...prev, [field.id]: true }));

      try {
        const formId = field.relationConfig!.formId!;
        const responses = await supabaseService.getFormResponses(formId);

        // Ensure responses is an array
        if (!Array.isArray(responses)) {
          console.error(
            `Expected array of responses for form ${formId}, got:`,
            responses
          );
          setRelatedResponses((prev) => ({
            ...prev,
            [field.id]: [],
          }));
          continue;
        }

        const formattedResponses = responses
          .map((response: any) => {
            const responseId = response.id;

            let data: Record<string, any> = {};
            try {
              if (response.data) {
                data = response.data;
              } else {
                const {
                  id,
                  created_at,
                  updated_at,
                  form_id,
                  ...rest
                } = response;
                data = rest;
              }
            } catch (error) {
              console.error("Error parsing response data:", error, response);
              data = {};
            }

            // Get display value from the configured display field
            let displayValue = `Response ${String(responseId).substring(
              0,
              8
            )}...`;

            if (field.relationConfig?.displayField) {
              const displayFieldValue = data[field.relationConfig.displayField];
              if (
                displayFieldValue !== undefined &&
                displayFieldValue !== null &&
                displayFieldValue !== ""
              ) {
                displayValue = String(displayFieldValue);
              } else {
                // Try to find any non-empty text field as fallback
                const firstTextValue = Object.values(data).find(
                  (val) =>
                    val !== undefined &&
                    val !== null &&
                    String(val).trim() !== ""
                );
                if (firstTextValue) {
                  const strValue = String(firstTextValue);
                  displayValue =
                    strValue.length > 50
                      ? strValue.substring(0, 50) + "..."
                      : strValue;
                }
              }
            }

            // Get created_at date
            const createdAt = response.created_at || new Date().toISOString();

            return {
              id: responseId,
              data: data,
              created_at: createdAt,
              displayValue,
              formId: formId,
            };
          })
          .filter((response) => response.id);

        setRelatedResponses((prev) => ({
          ...prev,
          [field.id]: formattedResponses,
        }));
      } catch (error) {
        console.error(
          `Error fetching related responses for field ${field.id}:`,
          error
        );
        toast.error(`Failed to load related data for ${field.label}`);

        setRelatedResponses((prev) => ({
          ...prev,
          [field.id]: [],
        }));
      } finally {
        setLoadingRelations((prev) => ({ ...prev, [field.id]: false }));
      }
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error for this field if it exists
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field: FormField) => {
      const value = formData[field.id];

      // Check required fields
      if (field.required) {
        if (field.type === "checkbox") {
          if (!value) {
            newErrors[field.id] = `${field.label} is required`;
          }
        } else if (
          field.type === "select" ||
          field.type === "radio" ||
          field.type === "relation"
        ) {
          if (!value || value.toString().trim() === "") {
            newErrors[field.id] = `Please select an option for ${field.label}`;
          }
        } else if (!value || value.toString().trim() === "") {
          newErrors[field.id] = `${field.label} is required`;
        }
      }

      // Email validation
      if (field.type === "email" && value && value.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }

      // Number validation
      if (field.type === "number" && value && value.trim() !== "") {
        if (isNaN(Number(value))) {
          newErrors[field.id] = "Please enter a valid number";
        }
      }

      // Relation validation
      if (field.type === "relation" && field.required && value) {
        // Ensure the selected value is a valid form ID
        const responses = relatedResponses[field.id] || [];
        const selectedResponse = responses.find((r) => r.id === value);
        if (!selectedResponse) {
          newErrors[field.id] = "Please select a valid option";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!responseId) {
      toast.error("Response ID is missing");
      return;
    }

    setUpdating(true);
    try {
      const result = await supabaseService.updateResponse(responseId, formData);

      if (result) {
        setIsUpdated(true);
        toast.success("Response updated successfully!");
        setErrors({});
      } else {
        toast.error("Failed to update response - no response received");
      }
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAnother = () => {
    // Navigate to create new response form
    navigate(`/form/submit/${formId}`);
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const isRequired = field.required;
    const fieldValue = formData[field.id] || "";
    const isLoading = loadingRelations[field.id];

    const baseProps = {
      id: field.id,
      required: isRequired,
      placeholder: field.placeholder || "",
      className: fieldError ? "border-red-500 focus-visible:ring-red-500" : "",
    };

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange(field.id, e.target.value)
            }
            rows={4}
          />
        );

      case "select":
        const hasOptions = field.options && field.options.length > 0;

        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={!hasOptions}
          >
            <SelectTrigger
              className={`w-full ${fieldError ? "border-red-500" : ""}`}
            >
              <SelectValue
                placeholder={
                  hasOptions
                    ? field.placeholder || "Select an option"
                    : "No options available"
                }
              />
            </SelectTrigger>
            {hasOptions && (
              <SelectContent>
                {field.options!.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
        );

      case "relation":
        const responses = relatedResponses[field.id] || [];
        const hasResponses = responses.length > 0;
        const relationFormTitle = field.relationConfig?.formTitle || "Related Form";

        return (
          <div className="space-y-2">
            <SearchableSelect
              value={fieldValue}
              onValueChange={(value) => handleInputChange(field.id, value)}
              options={responses.map((response) => ({
                value: response.id,
                label: response.displayValue,
                description: `Submitted ${new Date(
                  response.created_at
                ).toLocaleDateString()}`,
              }))}
              placeholder={
                isLoading
                  ? "Loading options..."
                  : hasResponses
                  ? field.placeholder || `Select from ${relationFormTitle}`
                  : "No responses available"
              }
              disabled={isLoading || !hasResponses}
              className={fieldError ? "border-red-500" : ""}
              emptyMessage="No responses found in related form"
            />
            {field.relationConfig?.formTitle && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="w-3 h-3" />
                <span>Linked to: {field.relationConfig.formTitle}</span>
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </div>
            )}
            {!isLoading && hasResponses && (
              <p className="text-xs text-muted-foreground">
                Selecting an option will create a relation to {relationFormTitle}
              </p>
            )}
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
            className={
              fieldError
                ? "space-y-2 border border-red-300 rounded-md p-4"
                : "space-y-2"
            }
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`${field.id}-${index}`}
                  className={fieldError ? "border-red-500" : ""}
                />
                <Label
                  htmlFor={`${field.id}-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
            {!field.options || field.options.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No options available
              </p>
            ) : null}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!fieldValue}
              onCheckedChange={(checked) =>
                handleInputChange(field.id, checked)
              }
              className={
                fieldError
                  ? "border-red-500 data-[state=checked]:bg-red-500"
                  : ""
              }
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {field.placeholder || field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );

      case "number":
        return (
          <Input
            type="number"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );

      case "email":
        return (
          <Input
            type="email"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );

      default: // text and other types
        return (
          <Input
            type="text"
            {...baseProps}
            value={fieldValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange(field.id, e.target.value)
            }
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formNotFound || responseNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {formNotFound ? "Form Not Found" : "Response Not Found"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {formNotFound 
                ? "The form doesn't exist or has been removed."
                : "The response doesn't exist or has been removed."}
            </p>
            <Button 
              onClick={() => navigate(`/form/${formId}/responses`)} 
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Responses List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Success State - Shows after update */}
        {isUpdated ? (
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4 text-green-700">
                Successfully Updated!
              </h1>

              <p className="text-lg text-muted-foreground mb-2">
                Your response for{" "}
                <span className="font-semibold">{formTitle}</span> has been updated.
              </p>

              <p className="text-muted-foreground mb-8">
                The changes have been saved successfully.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate(`/form/${formId}/responses`)}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Responses
                </Button>

                <Button
                  onClick={handleUpdateAnother}
                  variant="outline"
                  size="lg"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create New Response
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  You can view this response in the responses list.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Form Header - Only shows when NOT in updated state */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/form/${formId}/responses`)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Responses
              </Button>

              <h1 className="text-3xl font-bold mb-2">{formTitle}</h1>

              {formDescription && (
                <p className="text-muted-foreground mb-4">{formDescription}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Editing existing response • ID: {responseId?.substring(0, 8)}...</span>
              </div>

              {fields.length === 0 && (
                <Alert>
                  <AlertDescription>
                    This form has no fields to edit.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form - Only shows when NOT in updated state */}
            {fields.length > 0 ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Edit Response</CardTitle>
                  <CardDescription>
                    Update the form response values below
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleUpdate}>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {fields.map((field: FormField) => (
                        <div key={field.id} className="space-y-2">
                          {/* Don't show label for checkbox in the same way */}
                          {field.type !== "checkbox" && (
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                          )}

                          {renderField(field)}

                          {errors[field.id] && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors[field.id]}
                            </p>
                          )}

                          {field.type === "email" && !errors[field.id] && (
                            <p className="text-xs text-muted-foreground">
                              We'll never share your email with anyone else.
                            </p>
                          )}

                          {/* For checkbox fields, show label above if it's different from placeholder */}
                          {field.type === "checkbox" &&
                            field.placeholder !== field.label && (
                              <Label
                                htmlFor={field.id}
                                className="text-base font-medium block mb-1"
                              >
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                            )}
                        </div>
                      ))}

                      {/* Update Button */}
                      <div className="pt-6 border-t">
                        <Button
                          type="submit"
                          className="w-full"
                          size="lg"
                          disabled={updating}
                        >
                          {updating ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              Update Response
                            </>
                          )}
                        </Button>

                        <div className="mt-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            {fields.filter((f) => f.required).length > 0 ? (
                              <>
                                <span className="text-red-500">*</span> Required
                                fields
                                {" • "}
                                {fields.filter((f) => f.required).length}{" "}
                                required field(s)
                              </>
                            ) : (
                              "All fields are optional"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </form>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Empty Form</h3>
                  <p className="text-muted-foreground mb-4">
                    This form doesn't have any fields to edit.
                  </p>
                  <Button 
                    onClick={() => navigate(`/form/${formId}/responses`)} 
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Responses List
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Form Info Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                This form is powered by FormBuilder • Your response updates are secure and private
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}