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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  RefreshCw,
  Link,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface RelatedFormOption {
  id: string;
  displayValue: string;
  data: Record<string, any>;
}

export default function EditResponse() {
  const { formId, responseId } = useParams<{ formId: string; responseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});

  // Relation field data
  const [relationOptions, setRelationOptions] = useState<Record<string, RelatedFormOption[]>>({});
  const [loadingRelations, setLoadingRelations] = useState<Record<string, boolean>>({});
  const [openRelationPopovers, setOpenRelationPopovers] = useState<Record<string, boolean>>({});

  // Unsaved changes warning
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [navigateTo, setNavigateTo] = useState<string | null>(null);

  // Fetch form and response data
  useEffect(() => {
    if (!formId || !responseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch form details
        const form = await graphqlService.getFormById(formId);
        if (!form) {
          toast.error("Form not found");
          navigate(`/form/${formId}/responses`);
          return;
        }

        setFormTitle(form.title || "Untitled Form");

        // Parse form schema
        let parsedFields: FormField[] = [];
        try {
          let schema = form.schema;
          if (typeof schema === "string") {
            schema = JSON.parse(schema);
          }
          if (schema && typeof schema === "object" && "fields" in schema) {
            parsedFields = schema.fields || [];
          }
        } catch (error) {
          console.error("Error parsing schema:", error);
        }
        setFormFields(parsedFields);

        // Fetch response data
        const response = await graphqlService.getResponseById(responseId);
        if (!response) {
          toast.error("Response not found");
          navigate(`/form/${formId}/responses`);
          return;
        }

        // Parse response data - this should be the form field data
        let responseData: Record<string, any> = {};
        try {
          // The response.data field contains the form field values
          responseData = typeof response.data === "string" 
            ? JSON.parse(response.data) 
            : response.data;
        } catch (error) {
          console.error("Error parsing response data:", error);
          responseData = {};
        }

        setFormData(responseData);
        setOriginalData(responseData);

        // Fetch relation options for relation fields
        await fetchRelationOptions(parsedFields, responseData);

      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error(`Failed to load data: ${error.message}`);
        navigate(`/form/${formId}/responses`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId, responseId, navigate]);

  // Fetch options for relation fields
  const fetchRelationOptions = async (fields: FormField[], currentData: Record<string, any>) => {
    const relationFields = fields.filter(f => f.type === 'relation' && f.relationConfig?.formId);
    
    for (const field of relationFields) {
      setLoadingRelations(prev => ({ ...prev, [field.id]: true }));
      
      try {
        const relatedFormId = field.relationConfig!.formId!;
        const responses = await graphqlService.getFormResponses(relatedFormId);
        
        // Parse the related form to get display field configuration
        const relatedForm = await graphqlService.getFormById(relatedFormId);
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
        
        // Create options array
        const options: RelatedFormOption[] = [];
        
        responses.forEach((response: any) => {
          let data: Record<string, any> = {};
          try {
            data = typeof response.data === 'string' 
              ? JSON.parse(response.data) 
              : response.data;
          } catch (error) {
            console.error("Error parsing related response data:", error);
          }

          // Get display value
          let displayValue = `Response ${response.id?.substring?.(0, 8) || 'Unknown'}...`;
          
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
          
          options.push({
            id: String(response.id || ''),
            displayValue,
            data
          });
        });

        setRelationOptions(prev => ({
          ...prev,
          [field.id]: options
        }));
        
        // If this field has a value, ensure it's in the options
        const currentValue = currentData[field.id];
        if (currentValue && !options.some(opt => opt.id === String(currentValue))) {
          // Try to fetch the specific response
          try {
            const specificResponse = await graphqlService.getResponseById(currentValue);
            if (specificResponse) {
              let data: Record<string, any> = {};
              try {
                data = typeof specificResponse.data === 'string' 
                  ? JSON.parse(specificResponse.data) 
                  : specificResponse.data;
              } catch (error) {
                console.error("Error parsing specific response data:", error);
              }

              let displayValue = `Response ${specificResponse.id?.substring?.(0, 8) || 'Unknown'}...`;
              
              if (field.relationConfig?.displayField && data[field.relationConfig.displayField]) {
                displayValue = String(data[field.relationConfig.displayField]);
              }

              setRelationOptions(prev => ({
                ...prev,
                [field.id]: [
                  ...options,
                  {
                    id: String(specificResponse.id || ''),
                    displayValue,
                    data
                  }
                ]
              }));
            }
          } catch (error) {
            console.error(`Error fetching specific response ${currentValue}:`, error);
          }
        }
        
      } catch (error) {
        console.error(`Error fetching related form data for field ${field.id}:`, error);
        toast.error(`Failed to load options for ${field.label}`);
      } finally {
        setLoadingRelations(prev => ({ ...prev, [field.id]: false }));
      }
    }
  };

  // Check for unsaved changes
  useEffect(() => {
    const checkChanges = () => {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasChanges);
    };
    
    checkChanges();
  }, [formData, originalData]);

  // Handle field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle relation field change
  const handleRelationChange = (fieldId: string, responseId: string) => {
    handleFieldChange(fieldId, responseId);
    setOpenRelationPopovers(prev => ({ ...prev, [fieldId]: false }));
  };

  // Clear relation field
  const handleClearRelation = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleFieldChange(fieldId, "");
  };

  // Handle popover toggle
  const toggleRelationPopover = (fieldId: string, open: boolean) => {
    setOpenRelationPopovers(prev => ({ ...prev, [fieldId]: open }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = formFields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }
    
    setSaving(true);
    try {
      console.log("Submitting form data:", formData); // Debug log
      
      // Pass only the form field data, not the entire response object
      const updatedResponse = await graphqlService.updateResponse(responseId!, formData);
      
      if (updatedResponse) {
        toast.success("Response updated successfully");
        
        // Update original data with the new form data
        setOriginalData(formData);
        setHasChanges(false);
        
        // Navigate back to responses list
        navigate(`/form/${formId}/responses`);
      } else {
        toast.error("Failed to update response");
      }
      
    } catch (error: any) {
      console.error("Error updating response:", error);
      toast.error(`Failed to update response: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation with unsaved changes warning
  const handleNavigation = (path: string) => {
    if (hasChanges) {
      setNavigateTo(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  // Confirm navigation despite unsaved changes
  const confirmNavigation = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
    setShowUnsavedDialog(false);
    setNavigateTo(null);
  };

  // Get display value for a selected relation
  const getRelationDisplayValue = (fieldId: string, value: string): string => {
    const options = relationOptions[fieldId] || [];
    const selectedOption = options.find(opt => opt.id === String(value));
    return selectedOption?.displayValue || `ID: ${String(value).substring(0, 8)}...`;
  };

  // Safely get field options, filtering out empty strings
  const getFieldOptions = (field: FormField): string[] => {
    const options = field.options || [];
    return options.filter(opt => {
      if (typeof opt !== 'string') return false;
      return opt.trim() !== "";
    });
  };

  // Render field input based on type
  const renderFieldInput = (field: FormField) => {
    const value = formData[field.id];
    const isLoading = loadingRelations[field.id];
    const options = relationOptions[field.id] || [];
    const isOpen = openRelationPopovers[field.id] || false;
    const fieldOptions = getFieldOptions(field);

    switch (field.type) {
      case "text":
      case "email":
        return (
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              required={field.required}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.placeholder || "Check this box"}
            </Label>
          </div>
        );

      case "radio":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            className="space-y-2"
          >
            {fieldOptions.length > 0 ? (
              fieldOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option}
                    id={`${field.id}-${index}`}
                  />
                  <Label
                    htmlFor={`${field.id}-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No options defined for this field
              </p>
            )}
          </RadioGroup>
        );

      case "select":
      case "dropdown":
        return (
          <Select
            value={value || ""}
            onValueChange={(val) => {
              // Handle empty selection
              const finalValue = val === "__empty__" ? "" : val;
              handleFieldChange(field.id, finalValue);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {/* Only render the "Not selected" option if field is not required */}
              {!field.required && fieldOptions.length > 0 && (
                <SelectItem value="__empty__">-- Not selected --</SelectItem>
              )}
              
              {/* Render valid options */}
              {fieldOptions.length > 0 ? (
                fieldOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))
              ) : (
                // Show message if no valid options
                <SelectItem value="__no_options__" disabled>
                  No options defined for this field
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        );

      case "relation":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Link to: {field.relationConfig?.formTitle || "Related Form"}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading options...</span>
              </div>
            ) : (
              <Popover open={isOpen} onOpenChange={(open) => toggleRelationPopover(field.id, open)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between"
                  >
                    {value ? (
                      <div className="flex items-center justify-between w-full">
                        <span>{getRelationDisplayValue(field.id, value)}</span>
                        {!field.required && (
                          <X
                            className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={(e) => handleClearRelation(field.id, e)}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {field.placeholder || "Select related response..."}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search responses..." 
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No responses found.</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => (
                          <CommandItem
                            key={option.id}
                            value={option.displayValue}
                            onSelect={() => handleRelationChange(field.id, option.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{option.displayValue}</span>
                              <span className="text-xs text-muted-foreground">
                                ID: {option.id.substring(0, 8)}...
                              </span>
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                value === option.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );

      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      default:
        return (
          <Input
            id={field.id}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3].map((i) => (
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

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigation(`/form/${formId}/responses`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Response</h1>
            <p className="text-muted-foreground">
              {formTitle} • Response ID: {responseId?.substring(0, 8)}...
            </p>
          </div>
          
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Unsaved changes
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Response Details</CardTitle>
            <CardDescription>
              Make changes to the form response below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {formFields.map((field) => (
                <div key={field.id} className="space-y-3">
                  <Label htmlFor={field.id} className="flex items-center gap-2">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500">*</span>
                    )}
                    {field.type === 'relation' && field.relationConfig?.formTitle && (
                      <Badge variant="outline" className="text-xs">
                        {field.relationConfig.formTitle}
                      </Badge>
                    )}
                  </Label>
                  
                  {renderFieldInput(field)}
                  
                  <div className="text-xs text-muted-foreground">
                    Field type: {field.type}
                    {field.placeholder && ` • ${field.placeholder}`}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleNavigation(`/form/${formId}/responses`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-yellow-100 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false);
              setNavigateTo(null);
            }}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmNavigation}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}