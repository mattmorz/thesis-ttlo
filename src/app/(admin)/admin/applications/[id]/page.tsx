"use client";

import React, { useState } from "react";
import { CaseHeader } from "@/components/case-management/case-header";
import { SectionReviewPanel, ReviewSectionItem } from "@/components/case-management/admin/section-review-panel";
import { SectionCommentThread, CommentItem } from "@/components/case-management/section-comment-thread";
import { TimelineView, TimelineEvent } from "@/components/case-management/timeline-view";
import { QuickInfoDrawer, QuickInfoData } from "@/components/case-management/admin/quick-info-drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { User, Building, FileText, Clock, ShieldCheck, CheckCircle2, FileUp, AlertTriangle, Layers, Lock } from "lucide-react";
import { toast } from "sonner";

export default function StaffCaseWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = (params?.id as string) || "CASE-2024-001";
  const [activeTab, setActiveTab] = useState("sections");
  const [caseStatus, setCaseStatus] = useState("under_review");
  const [isQuickInfoOpen, setIsQuickInfoOpen] = useState(false);

  // Section review panel state
  const [reviewSections, setReviewSections] = useState<ReviewSectionItem[]>([
    {
      key: "applicant",
      title: "Applicant & Institutional Affiliation",
      status: "approved",
      comments: [],
    },
    {
      key: "inventors",
      title: "Inventors & Authors Contribution Matrix",
      status: "approved",
      comments: [],
    },
    {
      key: "research",
      title: "Research Abstract & Funding Compliance",
      status: "approved",
      comments: [],
    },
    {
      key: "claims",
      title: "Technical Claims & Novelty Prior Art",
      status: "needs_revision",
      reviewerFeedback: "Please clarify claim #2 regarding moisture sensing novel frequency modulation.",
      comments: [
        {
          id: "c-staff-1",
          authorName: "Engr. Reyes",
          authorRole: "ttlo_staff",
          content: "Claim 2 is borderline similar to utility model UM-2022-0045. Need inventor to articulate distinct feature.",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          isInternalOnly: true,
        },
      ],
    },
    {
      key: "documents",
      title: "Supporting Attachments & Drawings",
      status: "approved",
      comments: [],
    },
  ]);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    {
      id: "t-1",
      title: "Application Submitted",
      description: "Applicant Dr. Maria Santos submitted formal case file.",
      activityType: "submission",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      userAccount: { name: "Dr. Maria Santos", role: "client" },
    },
    {
      id: "t-2",
      title: "Assigned to Staff Reviewer",
      description: "Case assigned to Engr. Reyes for technical evaluation.",
      activityType: "update",
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      userAccount: { name: "Admin Morales", role: "admin" },
    },
    {
      id: "t-3",
      title: "Revision Demanded on Claims",
      description: "Section review marked 'Needs Revision' for novelty clarification.",
      activityType: "revision",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      userAccount: { name: "Engr. Reyes", role: "ttlo_staff" },
    },
  ]);

  const handleStatusChange = (newStatus: string) => {
    setCaseStatus(newStatus);
    toast.success(`Case stage updated to ${newStatus.replace(/_/g, " ").toUpperCase()}`);

    const evt: TimelineEvent = {
      id: `t-${Date.now()}`,
      title: `Case Stage Updated to ${newStatus.replace(/_/g, " ").toUpperCase()}`,
      description: `Staff member updated stage lifecycle status.`,
      activityType: "status_change",
      createdAt: new Date().toISOString(),
      userAccount: { name: "TTLO Staff Reviewer", role: "ttlo_staff" },
    };
    setTimelineEvents((prev) => [evt, ...prev]);
  };

  const handleSectionStatusChange = (
    sectionKey: string,
    newStatus: "approved" | "needs_revision" | "pending",
    feedback?: string
  ) => {
    setReviewSections((prev) =>
      prev.map((s) =>
        s.key === sectionKey ? { ...s, status: newStatus, reviewerFeedback: feedback } : s
      )
    );
    toast.success(`Section '${sectionKey}' set to ${newStatus.toUpperCase()}`);
  };

  const handleAddComment = (sectionKey: string, content: string, isInternal: boolean) => {
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      authorName: "Engr. Reyes",
      authorRole: "ttlo_staff",
      content,
      createdAt: new Date().toISOString(),
      isInternalOnly: isInternal,
    };

    setReviewSections((prev) =>
      prev.map((s) =>
        s.key === sectionKey
          ? { ...s, comments: [...(s.comments || []), newComment] }
          : s
      )
    );
    toast.success(isInternal ? "Internal staff note added" : "Public comment posted");
  };

  const quickData: QuickInfoData = {
    id: applicationId,
    title: "Smart IoT Soil Moisture & Environmental Monitoring System",
    applicantName: "Dr. Maria Santos",
    applicantEmail: "msantos@carsu.edu.ph",
    department: "College of Computing and Information Sciences",
    ipType: "patent",
    status: caseStatus,
    inventors: ["Dr. Maria Santos", "Engr. James Cruz", "John Michael Doe"],
    fundingSource: "DOST-PCAARRD Institutional Grant",
    grantNumber: "GR-2024-889",
    documentsCount: 4,
    pendingTasksCount: 1,
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Case Header for Staff */}
      <CaseHeader
        id={applicationId}
        title="Smart IoT Soil Moisture & Environmental Monitoring System"
        ipType="patent"
        status={caseStatus}
        applicantName="Dr. Maria Santos"
        department="College of Computing and Information Sciences"
        createdAt={new Date(Date.now() - 3600000 * 72).toISOString()}
        userRole="ttlo_staff"
        backUrl="/admin/projects"
        onStatusChange={handleStatusChange}
        onExport={() => toast.info("Exporting complete staff evaluation dossier...")}
        onArchive={() => handleStatusChange("archived")}
      />

      {/* Quick Drawer & Secondary Actions Bar */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Staff Management Workspace</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsQuickInfoOpen(true)}
          className="h-8 text-xs bg-white border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Info Panel</span>
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto bg-slate-100/80 p-1 text-xs">
          <TabsTrigger value="sections" className="text-xs font-semibold px-4 py-2">
            Section-by-Section Review
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold px-4 py-2">
            Document Verification
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs font-semibold px-4 py-2">
            Internal Staff Notes
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-semibold px-4 py-2">
            Complete Audit Log
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SECTION BY SECTION REVIEW */}
        <TabsContent value="sections" className="space-y-6">
          <SectionReviewPanel
            sections={reviewSections}
            userRole="ttlo_staff"
            onSectionStatusChange={handleSectionStatusChange}
            onAddComment={handleAddComment}
          />
        </TabsContent>

        {/* TAB 2: DOCUMENT VERIFICATION */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Document Compliance & Verification</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="p-4 border rounded-lg flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900">Technical_Drawings_Schematics_v1.pdf</p>
                    <p className="text-[11px] text-slate-400">2.4 MB • Uploaded by Dr. Maria Santos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                    Verified
                  </Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    View File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: INTERNAL STAFF NOTES */}
        <TabsContent value="notes" className="space-y-6">
          <Card className="border border-purple-200 bg-purple-50/20 shadow-sm">
            <CardHeader className="border-b border-purple-100 pb-3">
              <CardTitle className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                Confidential Staff Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <SectionCommentThread
                sectionTitle="Staff Confidential Log"
                sectionKey="internal_log"
                comments={[
                  {
                    id: "cn-1",
                    authorName: "Engr. Reyes",
                    authorRole: "ttlo_staff",
                    content: "Checked prior art database (IPOPHL e-Gazette). Similar patent registered in 2021. Applicant must clarify claim #2.",
                    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
                    isInternalOnly: true,
                  },
                ]}
                userRole="ttlo_staff"
                onAddComment={handleAddComment}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: AUDIT LOG */}
        <TabsContent value="history" className="space-y-6">
          <TimelineView events={timelineEvents} />
        </TabsContent>
      </Tabs>

      {/* Slide-over Quick Info Drawer */}
      <QuickInfoDrawer
        isOpen={isQuickInfoOpen}
        onClose={() => setIsQuickInfoOpen(false)}
        data={quickData}
      />
    </div>
  );
}
