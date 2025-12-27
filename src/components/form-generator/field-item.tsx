import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import type { FormField, FieldType } from "./types";

interface FieldItemProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
}

export default function FieldItem({ field, onUpdate, onRemove }: FieldItemProps) {
  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "number", label: "Number" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="cursor-move text-muted-foreground mt-3">
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`label-${field.id}`}>Field Label</Label>
                <Input
                  id={`label-${field.id}`}
                  value={field.label}
                  onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                  placeholder="Enter field label"
                />
              </div>
              
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
            </div>

            <div className="space-y-2">
              <Label htmlFor={`placeholder-${field.id}`}>Placeholder (Optional)</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder || ""}
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdate(field.id, { required: checked })}
                />
                <Label htmlFor={`required-${field.id}`}>Required Field</Label>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(field.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}