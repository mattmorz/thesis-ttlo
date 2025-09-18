"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

interface ArchivedForm {
  id: string;
  projectId: string;
  projectTitle: string;
  inventors: string[];
  formType: string;
  fileName: string;
  uploadDate: string;
  fileSize: string;
  fileUrl: string;
  description: string;
  status: "uploaded" | "pending";
  documentId: string;
}

interface ArchiveTableProps {
  data: ArchivedForm[];
  currentPage: number;
  itemsPerPage: number;
  onProjectSelect: (project: ArchivedForm) => void;
}

export function ArchiveTable({
  data,
  currentPage,
  itemsPerPage,
  onProjectSelect,
}: ArchiveTableProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const handleDownload = async (form: ArchivedForm) => {
    try {
      const response = await fetch(`/api/archives/download/${form.documentId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = form.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await fetch(`/api/archives/${documentId}`, {
        method: "DELETE",
      });
      // Refresh data after deletion
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="relative border rounded-md overflow-hidden">
      <style jsx global>{`
        .archive-table-container {
          scrollbar-width: thin;
          scroll-behavior: smooth;
        }
        .archive-table-container::-webkit-scrollbar {
          height: 8px;
          background-color: #f5f5f5;
        }
        .archive-table-container::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 8px;
        }
        .archive-table-container::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        .archive-table-container::-webkit-scrollbar-track {
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        .archive-table-row:hover td {
          background-color: #f8fafc;
        }
      `}</style>
      <div
        className="archive-table-container overflow-x-auto"
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          maxHeight: "calc(100vh - 350px)",
          scrollbarWidth: "thin",
          scrollBehavior: "smooth",
        }}
      >
        <div style={{ width: "850px", minWidth: "850px" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Form Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((form) => (
                <TableRow key={form.id} className="archive-table-row">
                  <TableCell>{form.projectId}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => onProjectSelect(form)}
                    >
                      {form.projectTitle}
                    </Button>
                  </TableCell>
                  <TableCell>{form.formType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {form.fileName}
                    </div>
                  </TableCell>
                  <TableCell>{form.uploadDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
