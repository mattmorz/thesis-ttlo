"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, MoreHorizontal, Filter, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AddEntryForm } from "./add-entry-form";
import { type InventoryFormData } from "./schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InventoryActions } from "./inventory-actions";

export function MechanicalInventory() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    field: "",
    ipType: "",
    status: "",
    fundingSource: "",
    startDate: "",
    endDate: "",
  });
  const itemsPerPage = 15;

  // Sample data based on the image
  const inventoryData = [
    {
      id: 1,
      clientId: "MC-001",
      inventors: [
        {
          name: "Carolina L. Alanunay",
          role: "Lead Inventor" as const,
        },
      ],
      projectTitle: "A Device for Processing of Coco Sugar",
      field: "Mechanical" as const,
      ipType: "Patent" as const,
      status: "Patent Searched" as const,
      startDate: "2022-01-12",
      endDate: "2023-01-12",
      fundingSource: "DOST" as const,
      applicationNo: "P-123456",
      commercializationStatus: "not_licensed",
    },
    {
      id: 2,
      clientId: "MC-002",
      inventors: [
        {
          name: "Jaymar D. Pal",
          role: "Lead Inventor" as const,
        },
      ],
      projectTitle: "A Device for Harvesting Agricultural Compost",
      field: "Mechanical" as const,
      ipType: "Patent" as const,
      status: "Ready for Application" as const,
      startDate: "2022-02-12",
      endDate: "2023-02-12",
      fundingSource: "CSU-funded" as const,
      applicationNo: "P-789012",
      commercializationStatus: "not_licensed",
    },
  ];

  const handleFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? currentData.map((item) => item.id) : []);
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  const handleAddEntry = (data: InventoryFormData) => {
    console.log(data);
  };

  const handleEdit = (data: InventoryFormData & { id: number }) => {
    // Update the inventory data
    console.log("Editing entry:", data);
  };

  const handleDelete = (id: number) => {
    // Remove the item from inventory data
    console.log("Deleting entry:", id);
  };

  const filteredData = inventoryData.filter((item) => {
    const dateInRange =
      (!filters.startDate || item.startDate >= filters.startDate) &&
      (!filters.endDate || item.endDate <= filters.endDate);

    const matchesSearch =
      item.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.inventors.some((inv) =>
        inv.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return (
      matchesSearch &&
      (!filters.field || item.field === filters.field) &&
      (!filters.ipType || item.ipType === filters.ipType) &&
      (!filters.status || item.status === filters.status) &&
      (!filters.fundingSource ||
        item.fundingSource === filters.fundingSource) &&
      dateInRange
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Update table columns
  const columns = [
    { key: "select", label: "", width: "w-12" },
    { key: "clientId", label: "Client ID" },
    { key: "inventors", label: "Inventors" },
    { key: "projectTitle", label: "Project Title" },
    { key: "field", label: "Field" },
    { key: "ipType", label: "IP Type" },
    { key: "status", label: "Status" },
    { key: "applicationNo", label: "Application No." },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
    { key: "fundingSource", label: "Funding Source" },
    { key: "actions", label: "", width: "w-12" },
  ];

  const resetFilters = () => {
    setFilters({
      field: "",
      ipType: "",
      status: "",
      fundingSource: "",
      startDate: "",
      endDate: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or inventor..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Inventory</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Field</Label>
                      <Select
                        onValueChange={(value) => handleFilter("field", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mechanical">Mechanical</SelectItem>
                          <SelectItem value="Chemical">Chemical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>IP Type</Label>
                      <Select
                        onValueChange={(value) => handleFilter("ipType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select IP type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Patent">Patent</SelectItem>
                          <SelectItem value="Utility Model">
                            Utility Model
                          </SelectItem>
                          <SelectItem value="Industrial Design">
                            Industrial Design
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select
                        onValueChange={(value) => handleFilter("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="For Application">
                            For Application
                          </SelectItem>
                          <SelectItem value="Patent Searched">
                            Patent Searched
                          </SelectItem>
                          <SelectItem value="Ready for Application">
                            Ready for Application
                          </SelectItem>
                          <SelectItem value="Granted">Granted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Funding Source</Label>
                      <Select
                        onValueChange={(value) =>
                          handleFilter("fundingSource", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOST">DOST</SelectItem>
                          <SelectItem value="PCAARRD">PCAARRD</SelectItem>
                          <SelectItem value="CSU-funded">CSU-funded</SelectItem>
                          <SelectItem value="Thesis">Thesis</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date Range</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">From</Label>
                          <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) =>
                              handleFilter("startDate", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">To</Label>
                          <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) =>
                              handleFilter("endDate", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                    <Button
                      type="submit"
                      onClick={() =>
                        (
                          document.querySelector(
                            '[role="dialog"]'
                          ) as HTMLDialogElement
                        )?.close()
                      }
                    >
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Entry</DialogTitle>
                </DialogHeader>
                <AddEntryForm onSubmit={handleAddEntry} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="relative border rounded-md overflow-hidden">
        <style jsx global>{`
          .mechanical-table-container {
            scrollbar-width: thin;
            scroll-behavior: smooth;
          }
          .mechanical-table-container::-webkit-scrollbar {
            height: 8px;
            background-color: #f5f5f5;
          }
          .mechanical-table-container::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 8px;
          }
          .mechanical-table-container::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          .mechanical-table-container::-webkit-scrollbar-track {
            background-color: #f5f5f5;
            border-radius: 8px;
          }
          .mechanical-table-row:hover td {
            background-color: #f8fafc;
          }
        `}</style>
        <div
          className="mechanical-table-container overflow-x-auto"
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
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedItems.length === currentData.length}
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean)
                      }
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">Inventors</TableHead>
                  <TableHead className="w-[190px]">Title</TableHead>
                  <TableHead className="w-[90px]">Field</TableHead>
                  <TableHead className="w-[110px]">
                    Type of IP Request
                  </TableHead>
                  <TableHead className="w-[110px]">IP Status</TableHead>
                  <TableHead className="w-[90px]">Date</TableHead>
                  <TableHead className="w-[90px]">Funding Source</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((item) => (
                  <TableRow key={item.id} className="mechanical-table-row">
                    <TableCell className="w-[40px]">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectItem(item.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[120px]">
                      {item.inventors
                        .map(
                          (inventor) => `${inventor.name} (${inventor.role})`
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell className="w-[190px] line-clamp-2">
                      {item.projectTitle}
                    </TableCell>
                    <TableCell className="w-[90px]">{item.field}</TableCell>
                    <TableCell className="w-[110px]">{item.ipType}</TableCell>
                    <TableCell className="w-[110px]">{item.status}</TableCell>
                    <TableCell className="w-[90px]">{item.startDate}</TableCell>
                    <TableCell className="w-[90px]">
                      {item.fundingSource}
                    </TableCell>
                    <TableCell className="w-[40px]">
                      <InventoryActions
                        item={{
                          ...item,
                          commercializationStatus:
                            item.commercializationStatus || "not_licensed",
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)}{" "}
          of {filteredData.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
