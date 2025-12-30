import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X, Link, AlertCircle, Info, Loader2 } from "lucide-react";
import type { FormField, FieldType } from "./types";
import { graphqlService } from "@/services/graphql.service";

interface FieldItemProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown (Select)" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "relation", label: "Form Relation" },
];

export default function FieldItem({ field, onUpdate, onRemove }: FieldItemProps) {
  const [newOption, setNewOption] = useState("");
  const [forms, setForms] = useState<any[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [relatedFormFields, setRelatedFormFields] = useState<Array<{ id: string; label: string; type: string }>>([]);
  const [loadingRelatedFields, setLoadingRelatedFields] = useState(false);

  // Fetch forms for relation configuration
  useEffect(() => {
    if (field.type === 'relation') {
      fetchForms();
    }
  }, [field.type]);

  // Fetch related form fields when form is selected
  useEffect(() => {
    if (field.type === 'relation' && field.relationConfig?.formId) {
      fetchRelatedFormFields(field.relationConfig.formId);
    } else {
      setRelatedFormFields([]);
    }
  }, [field.type, field.relationConfig?.formId]);

  const fetchForms = async () => {
    setLoadingForms(true);
    try {
      const fetchedForms = await graphqlService.getForms();
      setForms(fetchedForms);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchRelatedFormFields = async (formId: string) => {
    setLoadingRelatedFields(true);
    try {
      const form = await graphqlService.getFormById(formId);
      if (form && form.schema) {
        let schema;
        try {
          schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
        } catch (e) {
          console.error("Error parsing form schema:", e);
          return;
        }

        if (schema && schema.fields && Array.isArray(schema.fields)) {
          const fields = schema.fields.map((f: any) => ({
            id: f.id,
            label: f.label || `Field ${f.id}`,
            type: f.type
          }));
          setRelatedFormFields(fields);
        }
      }
    } catch (error) {
      console.error("Error fetching related form fields:", error);
    } finally {
      setLoadingRelatedFields(false);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const currentOptions = field.options || [];
      onUpdate(field.id, {
        options: [...currentOptions, newOption.trim()]
      });
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = field.options || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== index);
    onUpdate(field.id, { options: updatedOptions });
  };

  const handleOptionChange = (index: number, value: string) => {
    const currentOptions = field.options || [];
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = value;
    onUpdate(field.id, { options: updatedOptions });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newOption.trim()) {
      e.preventDefault();
      handleAddOption();
    }
  };

  const handleRelationConfigChange = (key: string, value: string) => {
    const currentConfig = field.relationConfig || {};
    const updates: any = {
      ...currentConfig,
      [key]: value
    };

    // When form changes, reset display field
    if (key === 'formId') {
      const selectedForm = forms.find(f => f.id === value);
      updates.formTitle = selectedForm?.title || "Untitled Form";
      updates.displayField = ""; // Reset display field
      // Value is always the form ID
      updates.valueField = value;
    }

    onUpdate(field.id, { relationConfig: updates });
  };

  const getSelectedForm = () => {
    return forms.find(f => f.id === field.relationConfig?.formId);
  };

  const getFieldDisplayName = (fieldId: string) => {
    const field = relatedFormFields.find(f => f.id === fieldId);
    return field ? `${field.label}` : fieldId;
  };

  // Helper function to check if placeholder should be shown for current field type
  const shouldShowPlaceholder = () => {
    const placeholderTypes = ['text', 'email', 'number', 'textarea', 'select'];
    return placeholderTypes.includes(field.type);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          {/* Field Type Selection */}
          <div className="space-y-2">
            <Label htmlFor={`type-${field.id}`}>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: FieldType) => {
                const updates: Partial<FormField> = { type: value };
                // Clear relation config if changing from relation type
                if (field.type === 'relation' && value !== 'relation') {
                  updates.relationConfig = undefined;
                }
                // Clear options if changing from select/radio to non-option type
                if ((field.type === 'select' || field.type === 'radio') && 
                    !['select', 'radio'].includes(value)) {
                  updates.options = undefined;
                }
                onUpdate(field.id, updates);
              }}
            >
              <SelectTrigger id={`type-${field.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label Input */}
          <div className="space-y-2">
            <Label htmlFor={`label-${field.id}`}>Label</Label>
            <Input
              id={`label-${field.id}`}
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              placeholder="Enter field label"
              className="w-full"
            />
          </div>

          {/* Placeholder Input (for text-based fields) */}
          {shouldShowPlaceholder() && (
            <div className="space-y-2">
              <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder || ""}
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Enter placeholder text"
                className="w-full"
              />
            </div>
          )}

          {/* Relation Configuration */}
          {field.type === 'relation' && (
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-primary" />
                <Label className="font-medium">Relation Configuration</Label>
              </div>
              
              <div className="space-y-3">
                {/* Related Form Selection */}
                <div className="space-y-2">
                  <Label htmlFor={`relation-form-${field.id}`}>Related Form</Label>
                  <Select
                    value={field.relationConfig?.formId || ""}
                    onValueChange={(value) => handleRelationConfigChange('formId', value)}
                    disabled={loadingForms}
                  >
                    <SelectTrigger id={`relation-form-${field.id}`}>
                      {loadingForms ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading forms...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a form to relate to" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title || "Untitled Form"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {field.relationConfig?.formId && (
                  <>
                    {/* Display Field Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`display-field-${field.id}`}>
                        Field to display in dropdown
                      </Label>
                      <Select
                        value={field.relationConfig?.displayField || ""}
                        onValueChange={(value) => handleRelationConfigChange('displayField', value)}
                        disabled={loadingRelatedFields}
                      >
                        <SelectTrigger id={`display-field-${field.id}`}>
                          {loadingRelatedFields ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading form fields...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select a field to display" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {/* Form fields */}
                          {relatedFormFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label} - {field.type}
                            </SelectItem>
                          ))}
                          {/* Show message if no fields */}
                          {relatedFormFields.length === 0 && !loadingRelatedFields && (
                            <SelectItem value="" disabled>
                              No fields found in the selected form
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The field from the related form to display in the dropdown
                      </p>
                    </div>

                    {/* Information Panel */}
                    <div className="rounded-md bg-primary/10 dark:bg-primary/20 p-3">
                      <p className="text-sm text-primary font-medium">
                        This field will create a relation to:{" "}
                        <span className="font-semibold">
                          {getSelectedForm()?.title || "Selected form"}
                        </span>
                      </p>
                      
                      {field.relationConfig?.displayField ? (
                        <>
                          <p className="text-sm text-primary mt-2">
                            In the dropdown, users will see: <span className="font-medium">
                              {getFieldDisplayName(field.relationConfig.displayField)}
                            </span>
                          </p>
                          <p className="text-sm text-primary mt-1">
                            The value stored will be: <span className="font-medium">
                              Form ID: {field.relationConfig.formId}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-primary mt-2">
                          ⓘ Select a field to display from the related form
                        </p>
                      )}
                      
                      <div className="mt-2 pt-2 border-t border-primary/20">
                        <p className="text-xs text-primary/80">
                          <span className="font-medium">Note:</span> The stored value will always be the Form ID ({field.relationConfig.formId}). 
                          This ensures consistent data relationships.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Options Management (for select and radio fields) */}
          {(field.type === 'select' || field.type === 'radio') && (
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="h-9 w-9 shrink-0"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add new option"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddOption}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!newOption.trim()}
                  aria-label="Add option"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add options for users to choose from. Press Enter or click + to add.
              </p>
            </div>
          )}

          {/* Required Switch */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <Label htmlFor={`required-${field.id}`} className="cursor-pointer">
                Required Field
              </Label>
              <p className="text-xs text-muted-foreground">
                Users must fill this field to submit the form
              </p>
            </div>
            <Switch
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => onUpdate(field.id, { required: checked })}
            />
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(field.id)}
          className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          aria-label="Remove field"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Validation messages */}
      {(field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0) && (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 dark:bg-warning/20 p-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
          <p className="text-sm text-warning">
            This {field.type} field has no options. Please add options above.
          </p>
        </div>
      )}

      {/* Relation configuration info */}
      {field.type === 'relation' && !field.relationConfig?.formId && (
        <div className="flex items-start gap-2 rounded-md bg-primary/10 dark:bg-primary/20 p-3">
          <Info className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-sm text-primary">
            Please select a form to create a relation.
          </p>
        </div>
      )}
    </div>
  );
}