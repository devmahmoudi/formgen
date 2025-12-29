import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Save, 
  Copy, 
  Download, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  Plus 
} from "lucide-react";
import { toast } from "sonner";
import { graphqlService } from "@/services/graphql.service";
import type { FormSchema, FormField } from "./types";
import FieldItem from "@/components/form-generator/field-item";

export default function EditForm() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<FormSchema>({
    title: "",
    description: "",
    fields: []
  });
  const [originalForm, setOriginalForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formNotFound, setFormNotFound] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch form details
  useEffect(() => {
    if (!formId) {
      setFormNotFound(true);
      setLoading(false);
      return;
    }

    const fetchForm = async () => {
      setLoading(true);
      setFormNotFound(false);
      
      try {
        const formData = await graphqlService.getFormById(formId);
        
        if (!formData) {
          setFormNotFound(true);
          toast.error("Form not found");
          return;
        }

        let parsedSchema: FormSchema = {
          title: "",
          description: "",
          fields: []
        };
        
        try {
          let schema = formData.schema;
          if (typeof schema === 'string') {
            schema = JSON.parse(schema);
          }
          
          if (schema && typeof schema === 'object') {
            parsedSchema = {
              title: schema.title || formData.title || "",
              description: schema.description || formData.description || "",
              fields: schema.fields || []
            };
          }
        } catch (parseError) {
          console.error("Error parsing schema:", parseError);
          // Fallback to basic structure
          parsedSchema = {
            title: formData.title || "",
            description: formData.description || "",
            fields: []
          };
        }
        
        setForm(parsedSchema);
        setOriginalForm(parsedSchema);
        
      } catch (error: any) {
        console.error("Error fetching form:", error);
        toast.error(`Failed to load form: ${error.message}`);
        setFormNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  // Check for changes
  useEffect(() => {
    if (originalForm && form) {
      const isChanged = JSON.stringify(form) !== JSON.stringify(originalForm);
      setHasChanges(isChanged);
    }
  }, [form, originalForm]);

  const addField = () => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: ""
    };
    
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (id: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== id)
    }));
  };

  const handleSaveChanges = async () => {
    if (!formId) {
      toast.error("Form ID is missing");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter a form title");
      return;
    }

    if (form.fields.length === 0) {
      toast.error("Please add at least one field to the form");
      return;
    }

    // Validate that select/radio fields have options
    const invalidFields = form.fields.filter(field => 
      (field.type === 'select' || field.type === 'radio') && 
      (!field.options || field.options.length === 0)
    );

    if (invalidFields.length > 0) {
      toast.error(`Please add options to ${invalidFields.length} ${invalidFields.length === 1 ? 'field' : 'fields'}: ${invalidFields.map(f => f.label).join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      // Prepare the form data for update
      const formData = {
        title: form.title,
        description: form.description || null,
        schema: JSON.stringify(form),
        updated_at: new Date().toISOString()
      };

      // Note: You'll need to add an updateForm method to your graphqlService
      const result = await graphqlService.updateForm(formId, formData);

      if (result) {
        toast.success("Form updated successfully!");
        setOriginalForm(form); // Update original to reflect saved state
        setHasChanges(false);
      } else {
        toast.error("Failed to update form - no response received");
      }
      
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(`Failed to update form: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!formId || !window.confirm("Are you sure you want to delete this form? This action cannot be undone and will also delete all responses.")) {
      return;
    }

    try {
      await graphqlService.deleteForm(formId);
      toast.success("Form deleted successfully");
      navigate("/form");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete form: ${error.message}`);
    }
  };

  const generateJSON = () => {
    return JSON.stringify(form, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateJSON());
    toast.success("JSON copied to clipboard!");
  };

  const downloadJSON = () => {
    const blob = new Blob([generateJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "form-schema.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded!");
  };

  const renderPreviewInput = (field: FormField) => {
    switch (field.type) {
      case "textarea":
        return <Textarea placeholder={field.placeholder} disabled />;
      
      case "select":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id={`preview-${field.id}-${index}`} 
                  name={`preview-${field.id}`}
                  disabled
                  className="h-4 w-4"
                />
                <Label htmlFor={`preview-${field.id}-${index}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id={`preview-${field.id}`}
              disabled
              className="h-4 w-4"
            />
            <Label htmlFor={`preview-${field.id}`} className="font-normal">
              {field.placeholder || "Check this box"}
            </Label>
          </div>
        );
      
      case "date":
        return <Input type="date" placeholder={field.placeholder} disabled />;
      
      default:
        return <Input type={field.type} placeholder={field.placeholder} disabled />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formNotFound) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The form you're trying to edit doesn't exist or has been removed.
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/form")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Form</h1>
            <p className="text-muted-foreground">Update your form structure and settings</p>
            <div className="flex items-center gap-2 mt-2">
              {hasChanges && (
                <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                ID: {formId?.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleDeleteForm}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Form
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Update your form title and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Form Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter form title"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed to users when they fill out the form
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter form description"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide additional context or instructions for users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>Edit your form fields and their properties</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.fields.map((field) => (
                  <FieldItem
                    key={field.id}
                    field={field}
                    onUpdate={updateField}
                    onRemove={removeField}
                  />
                ))}
              </div>
              
              <Button 
                onClick={addField} 
                variant="outline" 
                className="w-full mt-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Field
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions, Preview & JSON Output */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Save or export your form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={handleSaveChanges} 
                  className="w-full"
                  disabled={saving || !hasChanges || form.fields.length === 0}
                >
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
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="w-full"
                    disabled={form.fields.length === 0}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadJSON}
                    className="w-full"
                    disabled={form.fields.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>How your form will look to users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  )}
                </div>
                
                <div className="space-y-4">
                  {form.fields.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">No fields added yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add fields to see preview</p>
                    </div>
                  ) : (
                    form.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`preview-${field.id}`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderPreviewInput(field)}
                      </div>
                    ))
                  )}
                </div>
                
                {form.fields.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" disabled>Submit</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* JSON Output */}
          <Card>
            <CardHeader>
              <CardTitle>Current JSON</CardTitle>
              <CardDescription>Export this JSON for use in your applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-2">
                  This is the structure that will be saved:
                </div>
                {form.fields.length > 0 ? (
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px]">
                    {generateJSON()}
                  </pre>
                ) : (
                  <div className="bg-muted p-4 rounded-md text-center">
                    <p className="text-muted-foreground">Add fields to generate JSON</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning about responses */}
      {form.fields.length > 0 && hasChanges && (
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Changing field types or IDs after responses have been submitted may affect existing response data. 
            Consider creating a new form instead if you need major changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}