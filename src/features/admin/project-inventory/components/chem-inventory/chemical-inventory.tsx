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
import { DialogFooter } from "@/components/ui/dialog";
import { InventoryActions } from "@/features/admin/project-inventory/components/chem-inventory/inventory-actions";

export function ChemicalInventory() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [addEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    field: "",
    ipRequestType: "",
    ipStatus: "",
    fundingSource: "",
    startDate: "",
    endDate: "",
  });
  const itemsPerPage = 15;

  const handleSearch = () => {
    const filteredData = inventoryData.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inventors.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filteredData;
  };

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
    setAddEntryDialogOpen(false);
  };

  const handleEdit = (data: InventoryFormData & { id: number }) => {
    console.log("Editing entry:", data);
  };

  const handleDelete = (id: number) => {
    console.log("Deleting entry:", id);
  };

  // Sample data - replace with your actual data source
  const inventoryData = [
    {
      id: 1,
      inventors: "Kamille Mae L. Buron",
      title:
        "Development of Giant Taro Bioplastic Film Plasticized with Glycerol",
      field: "Chemical",
      ipRequestType: "Patent",
      ipStatus: "For Application",
      date: "2024-11-01",
      fundingSource: "DOST",
      commercializationStatus: "not_licensed",
    },
    {
      id: 2,
      inventors: "Rey Evanley Alanunay",
      title:
        "Recovery of Hexavalent Chromoum From Mine Waste Water Run-Off Using Cooperative Interaction of Ionic Liquid With Magnetic Nano-Particles",
      field: "Chemical",
      ipRequestType: "Patent",
      ipStatus: "For Application",
      date: "2024-11-01",
      fundingSource: "PCAARRD",
      commercializationStatus: "not_licensed",
    },
    {
      id: 3,
      inventors: "Joseph David L. Romanos",
      title:
        "Mercury Removal From Small-Scale Gold Mining Wastewater Using Chicken Feathers As a Low-Cost Absorbent",
      field: "Chemical",
      ipRequestType: "Patent",
      ipStatus: "For Application",
      date: "2024-11-11",
      fundingSource: "CSU-funded",
      commercializationStatus: "not_licensed",
    },
    {
      id: 4,
      inventors: "Marie Claire O. Virtudazo",
      title:
        "Application of Cassava Rhizome Biochar as a Biofilter in Reducing Chromium Concentration in Wastewater of Nickel Laterite",
      field: "Chemical",
      ipRequestType: "Patent",
      ipStatus: "For Application",
      date: "2024-11-12",
      fundingSource: "Thesis",
      commercializationStatus: "not_licensed",
    },
    // Add more entries following the same pattern up to 15 items
  ];

  const filteredData = inventoryData.filter((item) => {
    const dateInRange =
      (!filters.startDate || item.date >= filters.startDate) &&
      (!filters.endDate || item.date <= filters.endDate);

    return (
      (!filters.field || item.field === filters.field) &&
      (!filters.ipRequestType ||
        item.ipRequestType === filters.ipRequestType) &&
      (!filters.ipStatus || item.ipStatus === filters.ipStatus) &&
      (!filters.fundingSource ||
        item.fundingSource === filters.fundingSource) &&
      dateInRange
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const columns = [
    { key: "select", label: "", width: "w-12" },
    { key: "clientId", label: "Client ID" },
    { key: "projectTitle", label: "Title" },
    { key: "inventors", label: "Inventors" },
    { key: "field", label: "Field" },
    { key: "ipType", label: "IP Type" },
    { key: "status", label: "Status" },
    { key: "startDate", label: "Date" },
    { key: "fundingSource", label: "Funding" },
    { key: "actions", label: "", width: "w-12" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Add Entry */}
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
            <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
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
                          <SelectItem value="Chemical">Chemical</SelectItem>
                          <SelectItem value="Mechanical">Mechanical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>IP Request Type</Label>
                      <Select
                        onValueChange={(value) =>
                          handleFilter("ipRequestType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select IP type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Patent">Patent</SelectItem>
                          <SelectItem value="Copyright">Copyright</SelectItem>
                          <SelectItem value="Trademark">Trademark</SelectItem>
                          <SelectItem value="Trade Secret">
                            Trade Secret
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>IP Status</Label>
                      <Select
                        onValueChange={(value) =>
                          handleFilter("ipStatus", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Granted">Granted</SelectItem>
                          <SelectItem value="On-going Application">
                            On-going Application
                          </SelectItem>
                          <SelectItem value="For Application">
                            For Application
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
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
                    <Button
                      variant="outline"
                      onClick={() => setFilterDialogOpen(false)}
                    >
                      Close
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
            <Dialog
              open={addEntryDialogOpen}
              onOpenChange={setAddEntryDialogOpen}
            >
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

      {/* Table */}
      <div className="relative border rounded-md overflow-hidden">
        <style jsx global>{`
          .chemical-table-container {
            scrollbar-width: thin;
            scroll-behavior: smooth;
          }
          .chemical-table-container::-webkit-scrollbar {
            height: 8px;
            background-color: #f5f5f5;
          }
          .chemical-table-container::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 8px;
          }
          .chemical-table-container::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          .chemical-table-container::-webkit-scrollbar-track {
            background-color: #f5f5f5;
            border-radius: 8px;
          }
          .chemical-table-row:hover td {
            background-color: #f8fafc;
          }
        `}</style>
        <div
          className="chemical-table-container overflow-x-auto"
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
                  <TableHead className="w-[240px]">Title</TableHead>
                  <TableHead className="w-[100px]">Field</TableHead>
                  <TableHead className="w-[120px]">
                    Type of IP Request
                  </TableHead>
                  <TableHead className="w-[120px]">IP Status</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="w-[100px]">Funding Source</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((item) => (
                  <TableRow key={item.id} className="chemical-table-row">
                    <TableCell className="w-[40px]">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectItem(item.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[120px]">
                      {item.inventors}
                    </TableCell>
                    <TableCell className="w-[240px] line-clamp-2">
                      {item.title}
                    </TableCell>
                    <TableCell className="w-[100px]">{item.field}</TableCell>
                    <TableCell className="w-[120px]">
                      {item.ipRequestType}
                    </TableCell>
                    <TableCell className="w-[120px]">{item.ipStatus}</TableCell>
                    <TableCell className="w-[100px]">{item.date}</TableCell>
                    <TableCell className="w-[100px]">
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

      {/* Pagination */}
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
