"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  TradeSecretInventoryType,
  ApplicantType,
} from "../../../schemas/trade-secret";
import { Shield, Lock, User, Mail, Calendar, Info } from "lucide-react";

interface TradeSecretViewProps {
  record: TradeSecretInventoryType;
}

export function TradeSecretView({ record }: TradeSecretViewProps) {
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format status badge
  const renderStatusBadge = (status: string = "draft") => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Approved
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Submitted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Rejected
          </Badge>
        );
      case "pending_revision":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Pending Revision
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            Draft
          </Badge>
        );
    }
  };

  // Format applicant name
  const formatName = (
    firstName: string,
    lastName: string,
    middleInitial?: string
  ) => {
    return `${firstName} ${
      middleInitial ? middleInitial + ". " : ""
    }${lastName}`;
  };

  // Format applicants list
  const formatApplicants = () => {
    if (!record.applicants || record.applicants.length === 0) {
      return "None specified";
    }

    return record.applicants
      .map((applicant: ApplicantType) =>
        formatName(
          applicant.firstName,
          applicant.lastName,
          applicant.middleInitial
        )
      )
      .join(", ");
  };

  // Format disclosure status
  const formatDisclosureStatus = (type: "written" | "oral") => {
    const disclosures =
      type === "written"
        ? record.confirmation?.writtenDisclosures
        : record.confirmation?.oralDisclosures;

    if (!disclosures) return "Not specified";

    const statuses = [];
    if (disclosures.past) statuses.push("Past disclosures");
    if (disclosures.planned) statuses.push("Planned disclosures");
    if (disclosures.notApplicable) statuses.push("Not applicable");

    return statuses.length > 0 ? statuses.join(", ") : "None";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Secret Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle>Trade Secret Details</CardTitle>
            </div>
            <CardDescription>Details about the trade secret</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                ID
              </h4>
              <p className="text-sm">{record.tradeSecret.tradeSecretId}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {record.tradeSecret.description}
              </p>
            </div>
            <div>
              <h4 className="flex items-center text-sm font-medium text-muted-foreground mb-1">
                <Lock className="h-4 w-4 mr-1" />
                Confidentiality Measures
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {record.tradeSecret.confidentialityMeasures}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h4>
              <div>{renderStatusBadge(record.disclosure.status)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </h4>
                <p className="text-sm">
                  {formatDate(record.tradeSecret.createdAt)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Last Updated
                </h4>
                <p className="text-sm">
                  {formatDate(record.tradeSecret.updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <User className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle>Applicant Information</CardTitle>
            </div>
            <CardDescription>Details about the applicant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.user && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  User
                </h4>
                <p className="text-sm">{record.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {record.user.email}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Applicants
              </h4>
              <p className="text-sm">{formatApplicants()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Email
              </h4>
              <p className="text-sm">{record.disclosure.email || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Authorized Representative
              </h4>
              <p className="text-sm">
                {record.disclosure.authorizedRepresentative || "N/A"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Rightful Owner
              </h4>
              <p className="text-sm">
                {record.disclosure.isRightfulOwner ? "Yes" : "No"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclosure Confirmation Card */}
      {record.confirmation && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle>Disclosure Information</CardTitle>
            </div>
            <CardDescription>
              Confirmation details about the disclosure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Written Disclosures
                </h4>
                <p className="text-sm">{formatDisclosureStatus("written")}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Oral Disclosures
                </h4>
                <p className="text-sm">{formatDisclosureStatus("oral")}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Future Work
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {record.confirmation.futureWork || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Declaration Confirmed
              </h4>
              <p className="text-sm">
                {record.confirmation.confirmationDeclaration ? "Yes" : "No"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Confirmation Created
                </h4>
                <p className="text-sm">
                  {formatDate(record.confirmation.createdAt)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Confirmation Updated
                </h4>
                <p className="text-sm">
                  {formatDate(record.confirmation.updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
