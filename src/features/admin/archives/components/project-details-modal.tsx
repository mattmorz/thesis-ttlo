"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  AlertCircle,
  Building2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Undo2,
  User,
  Users,
} from "lucide-react";
import { RouterOutputs } from "@/trpc/client";
import { formatDate } from "@/lib/utils";
import { underscoreToSpace } from "@/lib/utils";

interface ProjectDetailsModalProps {
  data: RouterOutputs["archives"]["get"][number];
}

export function ProjectDetailsModal({ data }: ProjectDetailsModalProps) {
  if (!data) return null;

  return (
    <DialogContent className="max-w-[900px] p-0 h-[85vh] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="capitalize">
            {underscoreToSpace(data.ip_application?.ipType)}
          </Badge>
          <Badge
            variant={
              data.ip_application?.status === "completed"
                ? "default"
                : "secondary"
            }
            className="capitalize"
          >
            {underscoreToSpace(data.ip_application?.status)}
          </Badge>
        </div>
        <DialogTitle className="text-xl font-semibold mb-2">
          {data.ip_application?.title}
        </DialogTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {data.ip_application?.department}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {data.ip_application?.inventors?.join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Archived: {formatDate(data.archives?.archiveAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              By: {data.archives.archivedBy}
            </span>
          </div>
        </div>
        {data.archives.archiveReason && (
          <div className="mt-3 flex gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>
              <span className="font-medium">Archive Reason: </span>
              {data.archives.archiveReason}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ip-details">IP Details</TabsTrigger>
          <TabsTrigger value="phases">
            Phases
            <Badge variant="secondary" className="ml-2">
              1{/* {data.phases.length} */}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            <Badge variant="secondary" className="ml-2">
              1{/* {data.documents.length} */}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {data.ip_application?.description}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-3">Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Completion</span>
                      <span>
                        {/* {Math.round(
                          data.phases.reduce(
                            (acc, phase) => acc + phase.progress,
                            0
                          ) / data.phases.length
                        )} */}
                        %
                      </span>
                    </div>
                    {/* <Progress
                      value={
                        data.phases.reduce(
                          (acc, phase) => acc + phase.progress,
                          0
                        ) / data.phases.length
                      }
                      className="h-2"
                    /> */}
                  </div>
                  <div className="text-sm">
                    {/* {data.phases.map((phase) => (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span>{phase.title}</span>
                        <Badge
                          variant={
                            phase.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {phase.status}
                        </Badge>
                      </div>
                    ))} */}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* <TabsContent value="ip-details" className="mt-0">
            <div className="space-y-8">
              <div>
                <h3 className="font-medium mb-4">IP Information</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">IP Type</span>
                    <p className="mt-0.5">{data.ipDetails.ipType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-0.5">
                      <Badge
                        variant={
                          data.ipDetails.status === "Granted"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {data.ipDetails.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Application Number
                    </span>
                    <p className="mt-0.5">{data.ipDetails.applicationNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Registration Number
                    </span>
                    <p className="mt-0.5">
                      {data.ipDetails.registrationNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jurisdiction</span>
                    <p className="mt-0.5">{data.ipDetails.jurisdiction}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filing Date</span>
                    <p className="mt-0.5">
                      {formatDate(data.ipDetails.filingDate)}
                    </p>
                  </div>
                  {data.ipDetails.grantDate && (
                    <div>
                      <span className="text-muted-foreground">Grant Date</span>
                      <p className="mt-0.5">
                        {formatDate(data.ipDetails.grantDate)}
                      </p>
                    </div>
                  )}
                  {data.ipDetails.expiryDate && (
                    <div>
                      <span className="text-muted-foreground">Expiry Date</span>
                      <p className="mt-0.5">
                        {formatDate(data.ipDetails.expiryDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Commercialization</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1">
                      <Badge
                        variant={
                          data.commercialization.commercializationStatus ===
                          "Licensed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {data.commercialization.commercializationStatus}
                      </Badge>
                    </div>
                  </div>
                  {data.commercialization.licensees &&
                    data.commercialization.licensees.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Licensees</span>
                        <div className="mt-1 space-y-1">
                          {data.commercialization.licensees.map(
                            (licensee, index) => (
                              <div
                                key={`licensee-${index}`}
                                className="flex items-center gap-2"
                              >
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {licensee}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  <div className="grid grid-cols-2 gap-4">
                    {data.commercialization.licenseType && (
                      <div>
                        <span className="text-muted-foreground">
                          License Type
                        </span>
                        <p className="mt-0.5">
                          {data.commercialization.licenseType}
                        </p>
                      </div>
                    )}
                    {data.commercialization.royaltyTerms && (
                      <div>
                        <span className="text-muted-foreground">
                          Royalty Terms
                        </span>
                        <p className="mt-0.5">
                          {data.commercialization.royaltyTerms}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phases" className="mt-0">
            <div className="space-y-4">
              {data.phases.map((phase) => (
                <div key={phase.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{phase.title}</h3>
                    <Badge
                      variant={
                        phase.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {phase.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{phase.progress}%</span>
                    </div>
                    <Progress value={phase.progress} className="h-2" />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-3">
                    <span>{format(new Date(phase.startDate), "PP")}</span>
                    <span>{format(new Date(phase.endDate), "PP")}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <div className="space-y-2">
              {data.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.formType}</span>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>
                          Uploaded {format(new Date(doc.uploadDate), "PP")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent> */}
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      <div className="p-4 border-t flex items-center justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Close
          </Button>
        </DialogClose>
        <Button>
          <Undo2 className="h-4 w-4 mr-2" />
          Unarchive Project
        </Button>
      </div>
    </DialogContent>
  );
}
