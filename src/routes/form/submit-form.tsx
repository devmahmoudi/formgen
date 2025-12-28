import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  CheckCircle, 
  Send, 
  RefreshCw,
  AlertCircle,
  PlusCircle
} from "lucide-react";
import { toast } from "sonner";
import { graphqlService } from "@/services/graphql.service";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

export default function SubmitForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formNotFound, setFormNotFound] = useState(false);

  // Fetch form schema
  useEffect(() => {
    if (!id) {
      setFormNotFound(true);
      setLoading(false);
      return;
    }

    const fetchForm = async () => {
      setLoading(true);
      setFormNotFound(false);
      
      try {
        const form = await graphqlService.getFormById(id);
        
        if (!form) {
          setFormNotFound(true);
          toast.error("Form not found");
          return;
        }

        setFormTitle(form.title || "");
        setFormDescription(form.description || "");
        
        let parsedFields: FormField[] = [];
        
        try {
          // Parse the schema - it might be stored as a string
          let schema = form.schema;
          if (typeof schema === 'string') {
            schema = JSON.parse(schema);
          }
          
          if (schema && typeof schema === 'object' && 'fields' in schema) {
            parsedFields = schema.fields || [];
          }
        } catch (parseError) {
          console.error("Error parsing schema:", parseError);
          toast.error("Error loading form structure");
        }
        
        setFields(parsedFields);
        
        // Initialize form data structure with default values
        const initialData: Record<string, any> = {};
        parsedFields.forEach((field: FormField) => {
          switch (field.type) {
            case 'checkbox':
              initialData[field.id] = false;
              break;
            case 'number':
              initialData[field.id] = '';
              break;
            case 'select':
              initialData[field.id] = '';
              break;
            default:
              initialData[field.id] = '';
          }
        });
        setFormData(initialData);
        
      } catch (error: any) {
        console.error("Error fetching form:", error);
        toast.error(`Error loading form: ${error.message}`);
        setFormNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[fieldId]) {
      setErrors(prev => {
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
        if (field.type === 'checkbox') {
          if (!value) {
            newErrors[field.id] = `${field.label} is required`;
          }
        } else if (!value || value.toString().trim() === '') {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
      
      // Email validation
      if (field.type === 'email' && value && value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
      
      // Number validation
      if (field.type === 'number' && value && value.trim() !== '') {
        if (isNaN(Number(value))) {
          newErrors[field.id] = 'Please enter a valid number';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!id) {
      toast.error("Form ID is missing");
      return;
    }

    setSubmitting(true);
    try {
      const result = await graphqlService.submitFormResponse(id, formData);

      if (result) {
        setIsSubmitted(true);
        toast.success("Form submitted successfully!");
        setErrors({});
      } else {
        toast.error("Failed to submit form - no response received");
      }
      
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Failed to submit: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    setIsSubmitted(false);
    
    // Reset form data to initial values
    const resetData: Record<string, any> = {};
    fields.forEach((field: FormField) => {
      switch (field.type) {
        case 'checkbox':
          resetData[field.id] = false;
          break;
        default:
          resetData[field.id] = '';
      }
    });
    setFormData(resetData);
    setErrors({});
    
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const isRequired = field.required;
    const fieldValue = formData[field.id] || '';
    
    const baseProps = {
      id: field.id,
      required: isRequired,
      placeholder: field.placeholder || '',
      className: fieldError ? "border-red-500 focus-visible:ring-red-500" : "",
    };

    switch (field.type) {
      case 'textarea':
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
      
      case 'select':
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.id, value)}
          >
            <SelectTrigger className={fieldError ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
              <SelectItem value="option4">Option 4</SelectItem>
              <SelectItem value="option5">Option 5</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!fieldValue}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              className={fieldError ? "border-red-500 data-[state=checked]:bg-red-500" : ""}
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.placeholder || field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );
      
      default:
        return (
          <Input
            type={field.type}
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

  if (formNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The form you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate("/form")} 
              variant="outline"
            >
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
        {/* Success State - Shows after submission */}
        {isSubmitted ? (
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-4 text-green-700">
                Successfully Submitted!
              </h1>
              
              <p className="text-lg text-muted-foreground mb-2">
                Thank you for submitting <span className="font-semibold">{formTitle}</span>
              </p>
              
              <p className="text-muted-foreground mb-8">
                Your response has been recorded successfully.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleSubmitAnother}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Submit Another Response
                </Button>
                
                <Button
                  onClick={() => navigate("/form")}
                  variant="outline"
                  size="lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Forms List
                </Button>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Need to make changes? Click "Submit Another Response" to fill out the form again.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Form Header - Only shows when NOT in submitted state */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/form")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forms
              </Button>
              
              <h1 className="text-3xl font-bold mb-2">{formTitle}</h1>
              
              {formDescription && (
                <p className="text-muted-foreground mb-4">{formDescription}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Form is active and accepting responses</span>
              </div>
              
              {fields.length === 0 && (
                <Alert>
                  <AlertDescription>
                    This form has no fields to submit.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form - Only shows when NOT in submitted state */}
            {fields.length > 0 ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Fill out the form</CardTitle>
                  <CardDescription>
                    Please provide the following information
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {fields.map((field: FormField) => (
                        <div key={field.id} className="space-y-2">
                          {field.type !== 'checkbox' && (
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          )}
                          
                          {renderField(field)}
                          
                          {errors[field.id] && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors[field.id]}
                            </p>
                          )}
                          
                          {field.type === 'email' && !errors[field.id] && (
                            <p className="text-xs text-muted-foreground">
                              We'll never share your email with anyone else.
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {/* Submit Button */}
                      <div className="pt-6 border-t">
                        <Button 
                          type="submit" 
                          className="w-full"
                          size="lg"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Submit Response
                            </>
                          )}
                        </Button>
                        
                        <div className="mt-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            {fields.filter(f => f.required).length > 0 ? (
                              <>
                                <span className="text-red-500">*</span> Required fields
                                {" • "}
                                {fields.filter(f => f.required).length} required field(s)
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
                    This form doesn't have any fields to submit.
                  </p>
                  <Button
                    onClick={() => navigate("/form")}
                    variant="outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Forms List
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Form Info Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                This form is powered by FormBuilder • Your responses are secure and private
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}