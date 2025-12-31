import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  FileText,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabaseService } from "@/services/supabase.service";
import type { Form } from "@/types/form";
import FormCard from "@/components/form-card";
import type { FieldType } from "@/components/form-generator";

export default function FormList() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch forms on component mount
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlService.getForms();
      setForms(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await graphqlService.deleteForm(id);
      toast.success(`Form "${title}" deleted successfully`);

      // Remove the deleted form from local state
      setForms((prev) => prev.filter((form) => form.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete form");
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopySchema = (schema: any, title: string) => {
    try {
      const schemaToCopy =
        typeof schema === "string" ? JSON.parse(schema) : schema;
      navigator.clipboard.writeText(JSON.stringify(schemaToCopy, null, 2));
      toast.success(`Schema for "${title}" copied to clipboard`);
    } catch (err) {
      toast.error("Failed to copy schema");
      console.error("Copy error:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (loading && forms.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading forms: {error}</AlertDescription>
        </Alert>
        <Button onClick={fetchForms} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Forms</h1>
            <p className="text-muted-foreground">
              Create, manage, and view all your form schemas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/form/generator">
              <Button className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </Link>
          </div>
        </div>

        {/* Forms Grid */}
        {forms.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Forms Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first form to get started
              </p>
              <Link to="/form/generator">
                <Button className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: Form) => {
              const parsedSchema = parseSchema(form.schema);
              const fieldTypes: FieldType[] = parsedSchema?.fields
                ? Array.from(
                    new Set(parsedSchema.fields.map((f: any) => f.type))
                  )
                : [];
                
              return (
                <FormCard
                  form={form}
                  fieldTypes={fieldTypes}
                  handleDelete={handleDelete}
                  handleCopySchema={handleCopySchema}
                  deletingId={deletingId}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
