import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Form } from "@/types/form";
import type { FieldType } from "./form-generator";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Database,
} from "lucide-react";

function FormCard({
  form,
  fieldTypes,
  handleDelete,
  handleCopySchema,
  deletingId,
}: {
  form: Form;
  fieldTypes: FieldType[];
  handleDelete: (id: string, title: string) => void;
  handleCopySchema: (schema: any, title: string) => void;
  deletingId: string | null;
}) {
  const countFields = (schema: any) => {
    const parsed = parseSchema(schema);
    return parsed?.fields?.length || 0;
  };

  const parseSchema = (schema: any) => {
    try {
      if (typeof schema === "string") {
        return JSON.parse(schema);
      }
      return schema || { fields: [] };
    } catch {
      return { fields: [] };
    }
  };

  return (
    <Card
      key={form.id}
      className="hover:shadow-lg transition-shadow flex flex-col h-full gap-0"
    >
      <CardHeader className="min-h-[5.1rem]">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="mt-1 line-clamp-2 min-h-[2.5rem]">
                {form.description}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="ml-2 flex-shrink-0">
            {countFields(form.schema)} fields
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="space-y-2">
          {fieldTypes.length > 0 ? (
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Field Types:</p>
              <div className="flex flex-wrap gap-1">
                {fieldTypes.slice(0, 3).map((type: string) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
                {fieldTypes.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{fieldTypes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic pt-8 text-center">
              No fields defined
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 mt-auto">
        <div className="flex justify-between w-full">
          <div className="flex">
            <Link to={`/form/${form.id}/responses`}>
              <Button className="cursor-pointer" size="sm">
                <Database className="w-4 h-4 mr-1" />
                <span>Responses</span>
              </Button>
            </Link>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopySchema(form.schema, form.title)}
              className="cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Link to={`/form/edit/${form.id}`}>
              <Button size="sm" variant="outline" className="cursor-pointer">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              className="cursor-pointer"
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(form.id, form.title)}
              disabled={deletingId != null && deletingId === form.id}
            >
              {deletingId && deletingId === form.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default FormCard;
