import { useQuery, useMutation } from '@apollo/client/react';
import { GET_FORMS, DELETE_FORM } from '@/graphql/queries';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Form, FormEdge } from '@/types/form';

export default function FormList() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { loading, error, data, refetch } = useQuery(GET_FORMS);
  const [deleteForm] = useMutation(DELETE_FORM, {
    update(cache, { data: { deleteFromformsCollection } }) {
      if (deleteFromformsCollection?.records?.length > 0) {
        const deletedId = deleteFromformsCollection.records[0].id;
        
        cache.modify({
          fields: {
            formsCollection(existingCollection, { readField }) {
              const edges = existingCollection?.edges || [];
              return {
                ...existingCollection,
                edges: edges.filter(
                  (edge: FormEdge) => readField('id', edge.node) !== deletedId
                )
              };
            }
          }
        });
      }
    }
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteForm({ variables: { id } });
      toast.success(`Form "${title}" deleted successfully`);
    } catch (err: any) {
      toast.error('Failed to delete form');
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopySchema = (schema: Record<string, any>, title: string) => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    toast.success(`Schema for "${title}" copied to clipboard`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const countFields = (schema: Record<string, any>) => {
    return schema?.fields?.length || 0;
  };

  if (loading) {
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
          <AlertDescription>
            Error loading forms: {error.message}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="mt-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const forms = data?.formsCollection?.edges?.map((edge: FormEdge) => edge.node) || [];

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
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/form/generator">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Forms</p>
                  <p className="text-3xl font-bold">{forms.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Fields</p>
                  <p className="text-3xl font-bold">
                    {forms.reduce((acc: number, form: Form) => acc + countFields(form.schema), 0)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Created</p>
                  <p className="text-sm font-medium truncate">
                    {forms.length > 0 
                      ? formatDate(forms[0].created_at).split(',')[0]
                      : 'Never'
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
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
              <Link to="/form-generator">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: Form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
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
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created: {formatDate(form.created_at)}
                    </div>
                    
                    {form.updated_at && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Updated: {formatDate(form.updated_at)}
                      </div>
                    )}
                    
                    {form.schema?.fields && (
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">Field Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(
                            new Set(form.schema.fields.map((f: any) => f.type))
                          ).slice(0, 3).map((type: string) => (
                            <Badge 
                              key={type as string} 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {type}
                            </Badge>
                          ))}
                          {form.schema.fields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{form.schema.fields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopySchema(form.schema, form.title)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    <Link to={`/form/${form.id}/preview`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    
                    <Link to={`/form-generator?edit=${form.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <Button
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
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Info Alert */}
        {forms.length > 0 && (
          <Alert>
            <AlertDescription className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Click on a form to preview, edit, or copy its schema JSON
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}