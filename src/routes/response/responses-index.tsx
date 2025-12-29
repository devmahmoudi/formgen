import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { graphqlService } from "@/services/graphql.service";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select, radio, dropdown
}

interface FormResponse {
  id: string;
  form_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

interface FilterState {
  [fieldId: string]: {
    value: any;
    label: string;
    type: string;
  };
}

export default function ResponsesIndex() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const pageSizes = [10, 25, 50, 100];

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<{
    id: string;
    identifier: string;
  } | null>(null);

  // Get implicit operator based on field type
  const getImplicitOperator = (fieldType: string): string => {
    switch (fieldType) {
      case "text":
      case "email":
      case "textarea":
        return "contains"; // Text fields use "contains" for partial matching
      case "checkbox":
        return "isTrue"; // Checkboxes use "isTrue" for filtering
      case "select":
      case "radio":
      case "dropdown":
        return "equals"; // Selection fields use exact matching
      default:
        return "equals"; // All other fields use exact matching
    }
  };

  // Fetch form details
  useEffect(() => {
    if (!formId) return;

    const fetchFormDetails = async () => {
      setLoading(true);
      try {
        const form = await graphqlService.getFormById(formId);
        if (!form) {
          toast.error("Form not found");
          navigate("/form");
          return;
        }

        setFormTitle(form.title || "Untitled Form");

        // Parse form schema to get fields
        let parsedFields: FormField[] = [];
        try {
          let schema = form.schema;
          if (typeof schema === "string") {
            schema = JSON.parse(schema);
          }
          if (schema && typeof schema === "object" && "fields" in schema) {
            parsedFields = schema.fields || [];
          }
        } catch (error) {
          console.error("Error parsing schema:", error);
        }
        setFormFields(parsedFields);

        // Initialize filters for each field
        const initialFilters: FilterState = {};
        parsedFields.forEach((field) => {
          initialFilters[field.id] = {
            value: "",
            label: field.label,
            type: field.type,
          };
        });
        setFilters(initialFilters);
      } catch (error: any) {
        console.error("Error fetching form:", error);
        toast.error(`Failed to load form: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFormDetails();
  }, [formId, navigate]);

  // Fetch responses with filters
  const fetchResponses = useCallback(async () => {
    if (!formId) return;

    setLoading(true);
    try {
      // Build filters object with implicit operators
      const activeFilters: Record<string, { operator: string; value: any }> =
        {};

      // Add search term as a filter if present
      if (searchTerm.trim()) {
        // Apply search to all text fields with 'contains' operator
        Object.entries(filters).forEach(([fieldId, filter]) => {
          if (
            filter.type === "text" ||
            filter.type === "email" ||
            filter.type === "textarea"
          ) {
            activeFilters[fieldId] = {
              operator: "contains",
              value: searchTerm.trim(),
            };
          }
        });
      }

      // Add specific field filters with implicit operators
      Object.entries(filters).forEach(([fieldId, filter]) => {
        // Skip if value is empty, null, undefined, or the special __all__ placeholder
        if (
          !filter.value ||
          filter.value === "" ||
          filter.value === "__all__"
        ) {
          return;
        }

        // Don't override search term filters for text fields
        if (!activeFilters[fieldId] || filter.type !== "text") {
          let operator = getImplicitOperator(filter.type);
          let value = filter.value;

          // Special handling for checkbox values
          if (filter.type === "checkbox") {
            if (filter.value === "true") {
              value = true;
              operator = "isTrue";
            } else if (filter.value === "false") {
              value = false;
              operator = "isFalse";
            }
          }

          // For select/radio/dropdown, always use 'equals' operator for exact matching
          if (
            filter.type === "select" ||
            filter.type === "radio" ||
            filter.type === "dropdown"
          ) {
            operator = "equals";
          }

          activeFilters[fieldId] = {
            operator,
            value: value,
          };
        }
      });

      console.log("Active filters:", activeFilters); // Debug log

      // Fetch from Supabase with filters and pagination
      const result = await graphqlService.getFormResponsesWithFilters(
        formId,
        activeFilters,
        currentPage,
        pageSize
      );

      setResponses(result.responses);
      setTotalCount(result.total);
    } catch (error: any) {
      console.error("Error fetching responses:", error);
      toast.error(`Failed to load responses: ${error.message}`);
      setResponses([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [formId, filters, searchTerm, currentPage, pageSize]);

  // Initial fetch and fetch when filters/pagination change
  useEffect(() => {
    if (formId && formFields.length > 0) {
      fetchResponses();
    }
  }, [formId, formFields.length, fetchResponses]);

  const handleFilterChange = (fieldId: string, value: any) => {
    // If value is the special "__all__" placeholder, set it to empty string
    const actualValue = value === "__all__" ? "" : value;
    setFilters((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value: actualValue,
      },
    }));
    // Reset to first page when filter changes
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {};
    Object.keys(filters).forEach((fieldId) => {
      clearedFilters[fieldId] = {
        ...filters[fieldId],
        value: "",
      };
    });
    setFilters(clearedFilters);
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Render filter input based on field type
  const renderFilterInput = (field: FormField) => {
    const filter = filters[field.id];

    switch (field.type) {
      case "checkbox":
        return (
          <Select
            value={filter.value?.toString() || ""}
            onValueChange={(value) => handleFilterChange(field.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case "select":
      case "radio":
      case "dropdown":
        return (
          <Select
            value={filter.value || ""}
            onValueChange={(value) => handleFilterChange(field.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {/* Fix: Use a placeholder item with a non-empty value */}
              <SelectItem value="__all__">All</SelectItem>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={`Filter ${field.label.toLowerCase()}...`}
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(field.id, e.target.value)}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            placeholder={`Filter ${field.label.toLowerCase()}...`}
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(field.id, e.target.value)}
          />
        );

      case "text":
      case "email":
      case "textarea":
        return (
          <Input
            placeholder={`Search in ${field.label.toLowerCase()}...`}
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(field.id, e.target.value)}
          />
        );

      default:
        return (
          <Input
            placeholder={`Filter ${field.label.toLowerCase()}...`}
            value={filter.value || ""}
            onChange={(e) => handleFilterChange(field.id, e.target.value)}
          />
        );
    }
  };

  // Delete response functions
  const handleDeleteClick = (responseId: string, responseData: any) => {
    let identifier = "this response";
    try {
      const data = responseData;
      const firstField = Object.values(data)[0];
      if (firstField && String(firstField).trim()) {
        const fieldValue = String(firstField);
        identifier = `response "${fieldValue.substring(0, 30)}${
          fieldValue.length > 30 ? "..." : ""
        }"`;
      }
    } catch (error) {
      console.error("Error parsing response data:", error);
    }

    setResponseToDelete({ id: responseId, identifier });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!responseToDelete) return;

    setDeletingId(responseToDelete.id);
    try {
      await graphqlService.deleteResponse(responseToDelete.id);

      // Remove from local state
      setResponses((prev) =>
        prev.filter((response) => response.id !== responseToDelete.id)
      );
      setTotalCount((prev) => prev - 1);

      toast.success("Response deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete response: ${error.message}`);
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setResponseToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (responses.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Create CSV header
      const headers = [
        "Submission Date",
        ...formFields.map((field) => field.label),
        "Response ID",
      ];

      // Create CSV rows
      const rows = responses.map((response) => {
        const date = new Date(response.created_at).toLocaleString();
        const fieldValues = formFields.map((field) => {
          const value = response.data[field.id];
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma or newline
          if (
            stringValue.includes(",") ||
            stringValue.includes("\n") ||
            stringValue.includes('"')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        return [date, ...fieldValues, response.id];
      });

      // Combine header and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${formTitle.replace(/[^a-z0-9]/gi, "_")}_responses.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${responses.length} responses as CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
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

  // Render table actions cell
  const renderActionsCell = (response: FormResponse) => {
    const isDeleting = deletingId === response.id;

    return (
      <TableCell className="w-28">
        <div className="flex gap-1">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              toast.info("View response feature coming soon!");
            }}
            title="View response details"
            className="h-8 w-8"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button> */}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteClick(response.id, response.data)}
            disabled={isDeleting}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete response"
          >
            {isDeleting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </TableCell>
    );
  };

  if (loading && !responses.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
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
              <h1 className="text-3xl font-bold">{formTitle}</h1>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {totalCount} total responses
                </Badge>
                {Object.values(filters).some((f) => f.value) && (
                  <Badge variant="secondary" className="gap-1">
                    <Filter className="w-3 h-3" />
                    {responses.length} showing
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={responses.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search across all text fields..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="whitespace-nowrap"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                  {(searchTerm ||
                    Object.values(filters).some((f) => f.value)) && (
                    <Button variant="ghost" onClick={clearFilters} size="icon">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Dynamic Filters Panel */}
              {showFilters && formFields.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">Filter by Field</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label
                          htmlFor={`filter-${field.id}`}
                          className="text-sm"
                        >
                          {field.label}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({field.type})
                          </span>
                        </Label>
                        {renderFilterInput(field)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Responses</CardTitle>
                <CardDescription>
                  {responses.length === 0
                    ? "No responses found"
                    : `Showing ${responses.length} of ${totalCount} responses`}
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Rows per page:
                    </span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageSizes.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="px-3 text-sm">
                      Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(Math.ceil(totalCount / pageSize), prev + 1)
                        )
                      }
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage(Math.ceil(totalCount / pageSize))
                      }
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No responses found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {loading
                    ? "Loading responses..."
                    : "No responses match your current filters."}
                </p>
                {!loading && Object.values(filters).some((f) => f.value) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Submitted At</TableHead>
                      {formFields.map((field) => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {formatDate(response.created_at)}
                        </TableCell>
                        {formFields.map((field) => {
                          const value = response.data[field.id];
                          let displayValue = "";

                          if (value === null || value === undefined) {
                            displayValue = "-";
                          } else if (field.type === "checkbox") {
                            displayValue = value ? "✓ Yes" : "✗ No";
                          } else if (field.type === "email") {
                            displayValue = (
                              <a
                                href={`mailto:${value}`}
                                className="text-primary hover:underline"
                              >
                                {value}
                              </a>
                            );
                          } else if (field.type === "date") {
                            try {
                              displayValue = new Date(
                                value
                              ).toLocaleDateString();
                            } catch {
                              displayValue = String(value);
                            }
                          } else {
                            displayValue = String(value);
                          }

                          return (
                            <TableCell key={`${response.id}-${field.id}`}>
                              {displayValue}
                            </TableCell>
                          );
                        })}
                        {renderActionsCell(response)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>
                Delete {responseToDelete?.identifier || "Response"}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. The response will be permanently
              deleted from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId === responseToDelete?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId === responseToDelete?.id}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deletingId === responseToDelete?.id ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
