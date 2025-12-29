import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  Edit,
  Trash2,
  Copy,
  Calendar,
  FileText,
  RefreshCw,
  Plus,
  LayersPlus,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { graphqlService } from "@/services/graphql.service";
import type { Form } from "@/types/form";

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

  const countFields = (schema: any) => {
    const parsed = parseSchema(schema);
    return parsed?.fields?.length || 0;
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
            <Button variant="outline" onClick={fetchForms}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
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
              const fieldTypes = parsedSchema?.fields
                ? Array.from(
                    new Set(parsedSchema.fields.map((f: any) => f.type))
                  )
                : [];

              return (
                <Card
                  key={form.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">
                          {form.title}
                        </CardTitle>
                        {form.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {countFields(form.schema)} fields
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {fieldTypes.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">
                            Field Types:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {fieldTypes.slice(0, 3).map((type: string) => (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="text-xs"
                              >
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
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="gap-1 flex">
                      <Link to={`/form/submit/${form.id}`}>
                        <Button className="cursor-pointer" size="sm">
                          <LayersPlus className="w-4 h-4 mr-1" />
                          <span className="md:hidden xl:inline">
                            Data Entry
                          </span>
                        </Button>
                      </Link>

                      <Link to={`/form/${form.id}/responses`}>
                        <Button className="cursor-pointer" size="sm">
                          <Database className="w-4 h-4 mr-1" />
                          <span className="md:hidden xl:inline">Responses</span>
                        </Button>
                      </Link>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCopySchema(form.schema, form.title)
                        }
                        className="cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Link to={`/form/edit/${form.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        className="cursor-pointer"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(form.id, form.title)}
                        disabled={deletingId === form.id}
                      >
                        {deletingId === form.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
