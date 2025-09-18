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
  TrademarkInventoryType,
  ApplicantType,
} from "../../../schemas/trademark";
import {
  BookmarkCheck,
  Tag,
  Globe,
  Building,
  User,
  Mail,
  Calendar,
  Info,
} from "lucide-react";

interface TrademarkViewProps {
  record: TrademarkInventoryType;
}

export function TrademarkView({ record }: TrademarkViewProps) {
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

  // Format business type
  const formatBusinessType = () => {
    const businessType = record.trademark.businessType;
    if (!businessType) return "Not specified";

    const types = [];
    if (businessType.company) types.push("Company");
    if (businessType.soleProprietor) types.push("Sole Proprietor");

    return types.length > 0 ? types.join(", ") : "Not specified";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trademark Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <BookmarkCheck className="h-5 w-5 text-green-600 mr-2" />
              <CardTitle>Trademark Details</CardTitle>
            </div>
            <CardDescription>Details about the trademark</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                ID
              </h4>
              <p className="text-sm">{record.trademark.trademarkId}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Trademark Name
              </h4>
              <p className="text-sm">{record.trademark.trademarkName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {record.trademark.description}
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
                  {formatDate(record.trademark.createdAt)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Last Updated
                </h4>
                <p className="text-sm">
                  {formatDate(record.trademark.updatedAt)}
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
                Legal Name
              </h4>
              <p className="text-sm">{record.trademark.legalName || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Business Type
              </h4>
              <p className="text-sm">{formatBusinessType()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* International Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-green-600 mr-2" />
            <CardTitle>International Information</CardTitle>
          </div>
          <CardDescription>
            International details about the trademark
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Translation/Transliteration
            </h4>
            <p className="text-sm whitespace-pre-wrap">
              {record.trademark.translation || "None provided"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              NICE Classifications
            </h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {record.trademark.niceClassifications &&
              record.trademark.niceClassifications.length > 0 ? (
                record.trademark.niceClassifications.map(
                  (classification, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {classification}
                    </Badge>
                  )
                )
              ) : (
                <p className="text-sm">None specified</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
