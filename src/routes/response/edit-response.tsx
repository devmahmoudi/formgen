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
import {
  ArrowLeft,
  CheckCircle,
  Save,
  RefreshCw,
  AlertCircle,
  History,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { graphqlService } from "@/services/graphql.service";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select, radio, dropdown fields
}

export default function EditResponse() {
  const { formId, responseId } = useParams<{ formId: string; responseId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formNotFound, setFormNotFound] = useState(false);
  const [responseNotFound, setResponseNotFound] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [responseCreatedAt, setResponseCreatedAt] = useState("");
  const [responseUpdatedAt, setResponseUpdatedAt] = useState("");

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
        // Fetch form details
        const form = await graphqlService.getFormById(formId);

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
        const response = await graphqlService.getResponseById(responseId);

        if (!response) {
          setResponseNotFound(true);
          toast.error("Response not found");
          return;
        }

        if (response.form_id !== formId) {
          toast.error("Response does not belong to this form");
          setResponseNotFound(true);
          return;
        }

        setResponseCreatedAt(response.created_at);
        setResponseUpdatedAt(response.updated_at || response.created_at);

        let responseData: Record<string, any> = {};
        try {
          responseData = typeof response.data === 'string' 
            ? JSON.parse(response.data) 
            : response.data;
        } catch (error) {
          console.error("Error parsing response data:", error);
          responseData = {};
        }

        // Initialize form data structure with response values
        const initialData: Record<string, any> = {};
        parsedFields.forEach((field: FormField) => {
          const value = responseData[field.id];
          
          // Handle missing values in response
          if (value === undefined || value === null) {
            switch (field.type) {
              case "checkbox":
                initialData[field.id] = false;
                break;
              case "number":
                initialData[field.id] = "";
                break;
              case "select":
              case "radio":
                initialData[field.id] = "";
                break;
              default:
                initialData[field.id] = "";
            }
          } else {
            initialData[field.id] = value;
          }
        });

        setFormData(initialData);
        setOriginalData(initialData);

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

  // Check for changes
  useEffect(() => {
    if (Object.keys(originalData).length > 0 && Object.keys(formData).length > 0) {
      const isChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(isChanged);
    }
  }, [formData, originalData]);

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
        } else if (field.type === "select" || field.type === "radio") {
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
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!responseId) {
      toast.error("Response ID is missing");
      return;
    }

    setSaving(true);
    try {
      const result = await graphqlService.updateResponse(responseId, formData);

      if (result) {
        setIsSaved(true);
        setOriginalData(formData);
        setHasChanges(false);
        setResponseUpdatedAt(new Date().toISOString());
        toast.success("Response updated successfully!");
        setErrors({});
      } else {
        toast.error("Failed to update response - no response received");
      }
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleViewResponses = () => {
    navigate(`/form/${formId}/responses`);
  };

  const handleEditAnother = () => {
    setIsSaved(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const isRequired = field.required;
    const fieldValue = formData[field.id] || "";

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
                {field.options.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
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
      <div className="max-w-2xl mx-auto">
        {/* Success State - Shows after saving */}
        {isSaved ? (
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4 text-green-700">
                Changes Saved!
              </h1>

              <p className="text-lg text-muted-foreground mb-2">
                Response for <span className="font-semibold">{formTitle}</span> has been updated.
              </p>

              <p className="text-muted-foreground mb-8">
                The response has been successfully updated in the database.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleEditAnother}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <History className="w-5 h-5 mr-2" />
                  Edit This Response Again
                </Button>

                <Button
                  onClick={handleViewResponses}
                  variant="outline"
                  size="lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Responses
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Response ID: {responseId?.substring(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewResponses}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Responses
                </Button>
                
                {hasChanges && (
                  <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    Unsaved changes
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Edit Response</h1>
                  <p className="text-muted-foreground">
                    Update response for: <span className="font-semibold">{formTitle}</span>
                  </p>
                  {formDescription && (
                    <p className="text-sm text-muted-foreground mt-1">{formDescription}</p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted: {formatDate(responseCreatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <History className="w-4 h-4" />
                    <span>Last updated: {formatDate(responseUpdatedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Response ID: {responseId?.substring(0, 12)}...</span>
              </div>

              {fields.length === 0 && (
                <Alert className="mt-4">
                  <AlertDescription>
                    This form has no fields to edit.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form - Only shows when NOT in saved state */}
            {fields.length > 0 ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Edit Response Data</CardTitle>
                  <CardDescription>
                    Update the response values below
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSave}>
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

                      {/* Action Buttons */}
                      <div className="pt-6 border-t">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            type="submit"
                            className="sm:flex-1"
                            size="lg"
                            disabled={saving || !hasChanges}
                          >
                            {saving ? (
                              <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              setFormData(originalData);
                              setErrors({});
                              toast.info("Changes discarded");
                            }}
                            disabled={!hasChanges}
                          >
                            Discard Changes
                          </Button>
                        </div>

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
                  <Button onClick={handleViewResponses} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Responses
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Editing response in real-time • Changes are saved to the database
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {formatDate(responseUpdatedAt)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}