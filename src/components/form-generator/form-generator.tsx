import { useState } from "react";
import { useMutation } from "@apollo/client/react";
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
import { CREATE_FORM } from "@/graphql/queries";
import type { FormSchema, FormField } from "./types";

// Export types for external use
export type { FormSchema, FormField };

export default function FormGenerator() {
  const [form, setForm] = useState<FormSchema>({
    title: "Customer Feedback Survey",
    description: "A simple form to collect customer opinions",
    fields: [
      {
        id: "field_001",
        type: "text",
        label: "Your Full Name",
        required: false,
        placeholder: "John Doe"
      },
      {
        id: "field_002",
        type: "email",
        label: "Email Address",
        required: true
      },
      {
        id: "field_003",
        type: "number",
        label: "Rate us 1-10",
        required: true
      }
    ]
  });

  const [createFormMutation, { loading: saving }] = useMutation(CREATE_FORM);

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

    try {
      // Prepare the form data for Supabase
      // Create a clean schema object - just the fields array
      const schemaData = {
        fields: form.fields.map(field => ({
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
          placeholder: field.placeholder || null
        }))
      };

      console.log("Preparing to save:", {
        title: form.title,
        description: form.description,
        schema: schemaData
      });

      const result = await createFormMutation({
        variables: {
          objects: [
            {
              title: form.title,
              description: form.description || null,
              schema: schemaData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        }
      });

      console.log("Save result:", result);

      if (result.data?.insertIntoformsCollection?.records?.length > 0) {
        toast.success("Form saved successfully to database!");
        
        // Optional: Reset form after successful save
        // setForm({
        //   title: "",
        //   description: "",
        //   fields: []
        // });
      } else {
        toast.error("No records were created");
      }
      
    } catch (error: any) {
      console.error("Save error:", error);
      
      // Try alternative: Pass schema as stringified JSON
      try {
        const schemaString = JSON.stringify({
          fields: form.fields.map(field => ({
            id: field.id,
            type: field.type,
            label: field.label,
            required: field.required,
            placeholder: field.placeholder || null
          }))
        });

        console.log("Trying alternative with stringified JSON:", schemaString);

        const altResult = await createFormMutation({
          variables: {
            objects: [
              {
                title: form.title,
                description: form.description || null,
                schema: schemaString, // Pass as JSON string
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          }
        });

        console.log("Alternative save result:", altResult);
        
        if (altResult.data?.insertIntoformsCollection?.records?.length > 0) {
          toast.success("Form saved successfully (stringified JSON)!");
        } else {
          toast.error("Form not saved with alternative method");
        }
        
      } catch (altError: any) {
        toast.error(`Failed to save form: ${altError.message}`);
      }
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>Add and configure form fields</CardDescription>
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
                  disabled={saving}
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
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadJSON}
                    className="w-full"
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
              <CardDescription>How your form will look</CardDescription>
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
                  {form.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`preview-${field.id}`}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={`preview-${field.id}`}
                          placeholder={field.placeholder}
                          disabled
                        />
                      ) : field.type === "select" ? (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select an option"} />
                          </SelectTrigger>
                        </Select>
                      ) : (
                        <Input
                          id={`preview-${field.id}`}
                          type={field.type}
                          placeholder={field.placeholder}
                          disabled
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" disabled>Submit</Button>
                </div>
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
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px]">
                  {JSON.stringify({
                    title: form.title,
                    description: form.description,
                    fields: form.fields
                  }, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}