"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, Link } from "lucide-react";
import { format } from "date-fns";
import { ArchivedProject } from "../../../../app/(admin)/admin/archives/types";
import { Button } from "@/components/ui/button";

interface IPDetailsTabProps {
  project: ArchivedProject;
}

export function IPDetailsTab({ project }: IPDetailsTabProps) {
  const { ipDetails, commercialization } = project;

  if (!ipDetails || !commercialization) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No IP details available for this project.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* IP Information Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">IP Information</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                IP Type
              </p>
              <p className="mt-1">{ipDetails.ipType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={
                  ipDetails.status === "Granted" ? "default" : "secondary"
                }
                className="mt-1"
              >
                {ipDetails.status}
              </Badge>
            </div>
            {ipDetails.applicationNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Application Number
                </p>
                <p className="mt-1">{ipDetails.applicationNumber}</p>
              </div>
            )}
            {ipDetails.registrationNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Registration Number
                </p>
                <p className="mt-1">{ipDetails.registrationNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Jurisdiction
              </p>
              <p className="mt-1">{ipDetails.jurisdiction}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Filing Date
              </p>
              <p className="mt-1">
                {ipDetails.filingDate &&
                  format(new Date(ipDetails.filingDate), "PP")}
              </p>
            </div>
            {ipDetails.grantDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Grant Date
                </p>
                <p className="mt-1">
                  {format(new Date(ipDetails.grantDate), "PP")}
                </p>
              </div>
            )}
            {ipDetails.expiryDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expiry Date
                </p>
                <p className="mt-1">
                  {format(new Date(ipDetails.expiryDate), "PP")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commercialization Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Commercialization</h3>
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Status
              </p>
              <Badge
                variant={
                  commercialization.commercializationStatus === "Licensed"
                    ? "default"
                    : "secondary"
                }
              >
                {commercialization.commercializationStatus}
              </Badge>
            </div>
            {commercialization.licensees &&
              commercialization.licensees.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Licensees
                  </p>
                  <div className="grid gap-2">
                    {commercialization.licensees.map((licensee, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{licensee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {commercialization.licenseType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  License Type
                </p>
                <p>{commercialization.licenseType}</p>
              </div>
            )}
            {commercialization.royaltyTerms && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Royalty Terms
                </p>
                <p>{commercialization.royaltyTerms}</p>
              </div>
            )}
            {commercialization.revenue !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Revenue
                </p>
                <p>₱{commercialization.revenue.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Related Projects Card */}
      {project.relatedProjects && project.relatedProjects.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Related Projects</h3>
            <div className="grid gap-2">
              {project.relatedProjects.map((projectId) => (
                <Button
                  key={projectId}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Project {projectId}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
