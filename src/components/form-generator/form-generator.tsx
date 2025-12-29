import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import FieldItem from "./field-item";
import { Plus, Copy, Download, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { graphqlService } from "@/services/graphql.service";
import type { FormSchema, FormField, FieldType } from "./types";

// Export types for external use
export type { FormSchema, FormField, FieldType };

export default function FormGenerator() {
  const [form, setForm] = useState<FormSchema>({
    title: "Customer Feedback Survey",
    description: "A simple form to collect customer opinions",
    fields: [
      {
        id: "field_001",
        type: "text",
        label: "Name",
        required: true,
        placeholder: "Enter name ..."
      },
    ]
  });

  const [saving, setSaving] = useState(false);

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

  const handleSaveToDatabase = async () => {
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
      // Prepare the form data for Supabase
      const formData = {
        title: form.title,
        description: form.description || null,
        schema: JSON.stringify(form), // Store the complete form schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("Saving form data:", formData);

      const result = await graphqlService.createForm(formData);

      if (result) {
        toast.success("Form saved successfully to database!");
        
        // Optional: Reset form after successful save
        // setForm({
        //   title: "",
        //   description: "",
        //   fields: []
        // });
      } else {
        toast.error("Failed to save form - no response received");
      }
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Failed to save form: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Render preview input based on field type
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Form Generator</h1>
          <p className="text-muted-foreground">Build forms visually and export as JSON or save to database</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure your form title and description</CardDescription>
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
                  <CardDescription>Add and configure form fields</CardDescription>
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
                  onClick={handleSaveToDatabase} 
                  className="w-full"
                  disabled={saving || form.fields.length === 0}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save to Database
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
              <CardTitle>JSON Output</CardTitle>
              <CardDescription>Export this JSON for use in your applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-2">
                  This is the exact structure that will be saved:
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
    </div>
  );
}