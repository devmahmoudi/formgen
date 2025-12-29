import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X } from "lucide-react";
import type { FormField, FieldType } from "./types";

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
];

export default function FieldItem({ field, onUpdate, onRemove }: FieldItemProps) {
  const [newOption, setNewOption] = useState("");

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

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          {/* Field Type Selection */}
          <div className="space-y-2">
            <Label htmlFor={`type-${field.id}`}>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: FieldType) => onUpdate(field.id, { type: value })}
            >
              <SelectTrigger id={`type-${field.id}`}>
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
              placeholder="Field label"
            />
          </div>

          {/* Placeholder Input (for text-based fields) */}
          {(field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'textarea') && (
            <div className="space-y-2">
              <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder || ""}
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder text"
              />
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
                      className="h-9 w-9"
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
                  className="h-9 w-9"
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
            <div>
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
          className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info about options for select/radio fields */}
      {(field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0) && (
        <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ This {field.type} field has no options. Please add options above.
          </p>
        </div>
      )}
    </div>
  );
}