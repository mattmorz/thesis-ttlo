"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  FileText,
  Download,
  Eye,
  Calendar,
  Filter,
  FileIcon,
  Image,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";

// Define the document type from the database schema
type OtherDocument = {
  documentId: string;
  formId?: string;
  userId: string;
  ipApplicationId: string;
  title?: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category?: string;
  description?: string;
  uploadedAt: string;
  status: string;
};

function ViewDocuments() {
  const { toast } = useToast();
  const params = useParams();
  const formId = params.formId as string;

  // Get the active application ID for multi-IP application support
  const { activeApplicationId, activeApplication } = useActiveApplication();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [documents, setDocuments] = useState<OtherDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Fetch documents from the API
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!activeApplicationId) return;

      setLoading(true);
      try {
        // Build the URL - only include formId if it exists
        let url = `/api/documents/other?ipApplicationId=${activeApplicationId}`;
        if (formId) {
          url += `&formId=${formId}`;
        }

        // Fetch the documents for this application (and optionally form)
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again later.",
          variant: "destructive",
        });
        // Set empty array in case of error
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    if (activeApplicationId) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setLoading(false);
    }
  }, [formId, activeApplicationId, toast]);

  // Filter documents based on search query and category
  const filteredDocuments = documents.filter((doc) => {
    const docName = doc.title || doc.originalName; // Use title if available, otherwise fallback to originalName
    const matchesSearch =
      docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      doc.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // For demo, use mock data if no documents are found
  const hasDocuments = filteredDocuments.length > 0;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf"))
      return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FileText className="h-5 w-5 text-blue-500" />;
    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheet")
    )
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (mimeType.includes("image"))
      return <Image className="h-5 w-5 text-purple-500" />;
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/other/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Update local state
      setDocuments((prev) =>
        prev.filter((doc) => doc.documentId !== documentId)
      );

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <FormItem className="space-y-2">
        <FormLabel className="text-base font-medium">
          Document Library
        </FormLabel>
        <FormDescription>
          View and manage documents related to your IP application.
        </FormDescription>
      </FormItem>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents by name or description..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-shrink-0 w-full md:w-[180px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="publication">Publications</SelectItem>
              <SelectItem value="thesis">Thesis</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="patent">Patent/UM Application</SelectItem>
              <SelectItem value="matrix"> Matrix Sample</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading documents...
        </div>
      ) : !hasDocuments ? (
        <div className="py-8 text-center text-muted-foreground">
          No documents found. Upload documents to see them here.
        </div>
      ) : (
        <>
          <Separator />
          <ScrollArea className="max-h-[60vh]  pr-4">
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.documentId}
                  className="flex flex-col space-y-2 bg-white rounded-lg border p-4 hover:border-gray-300 transition-colors break-words"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-gray-50 p-2 rounded-md">
                        {getFileIcon(doc.mimeType)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium">
                          {doc.title || doc.originalName}
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {doc.originalName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => window.open(doc.filePath, "_blank")}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span>View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          // Create a link element and trigger download
                          const a = document.createElement("a");
                          a.href = doc.filePath;
                          a.download = doc.originalName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span>Download</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setDocumentToDelete(doc.documentId)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span>Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirm Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this document?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setDocumentToDelete(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() =>
                                handleDeleteDocument(doc.documentId)
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {doc.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {doc.description}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="inline-flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                    <div className="inline-flex items-center text-xs text-gray-500">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                    {doc.category && (
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

// For backwards compatibility
export const ViewDocumentsTab = ViewDocuments;

// Default export for dynamic import
export default ViewDocuments;
