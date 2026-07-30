"use client";

import React, { useState } from "react";
import { CaseHeader } from "@/components/case-management/case-header";
import { ProgressTracker } from "@/components/case-management/progress-tracker";
import { CompletionChecklist } from "@/components/case-management/completion-checklist";
import { StructuredRevisionCard, RevisionRequest } from "@/components/case-management/structured-revision-card";
import { SectionCommentThread, CommentItem } from "@/components/case-management/section-comment-thread";
import { TimelineView, TimelineEvent } from "@/components/case-management/timeline-view";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { useParams, useRouter } from "next/navigation";
import { User, Building, FileText, Clock, ShieldCheck, CheckCircle2, FileUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ApplicantCaseWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = (params?.id as string) || "";
  const [activeTab, setActiveTab] = useState("overview");

  // Mock initial state data to ensure smooth offline/demo rendering
  const [caseStatus, setCaseStatus] = useState("under_review");

  const [revisions, setRevisions] = useState<RevisionRequest[]>([
    {
      id: "rev-1",
      section: "Claims & Technical Problem",
      sectionKey: "ip_info",
      comment: "Please clarify how claim #2 achieves novel moisture sensing compared to existing patent US-2021-998.",
      requestedBy: "TTLO Staff (Engr. Reyes)",
      requestedAt: new Date().toISOString(),
      deadline: "2026-08-15",
      isResolved: false,
    },
  ]);

  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: "c-1",
      authorName: "Engr. Reyes",
      authorRole: "ttlo_staff",
      content: "Initial technical specification review complete. Outstanding clarification requested on novelty claims.",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    {
      id: "t-1",
      title: "Application Submitted by Applicant",
      description: "Initial application submitted for formal TTLO review.",
      activityType: "submission",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      userAccount: { name: "Dr. Maria Santos", role: "client" },
    },
    {
      id: "t-2",
      title: "Revision Requested by Staff",
      description: "Structured revision demand issued for Claims section.",
      activityType: "revision",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      userAccount: { name: "Engr. Reyes", role: "ttlo_staff" },
    },
  ]);

  const handleAddComment = (sectionKey: string, content: string, isInternal: boolean) => {
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      authorName: "Dr. Maria Santos",
      authorRole: "client",
      content,
      createdAt: new Date().toISOString(),
      isInternalOnly: false,
    };
    setComments((prev) => [...prev, newComment]);
    toast.success("Comment added to case");
  };

  const handleResolveRevision = (revisionId: string) => {
    setRevisions((prev) =>
      prev.map((r) => (r.id === revisionId ? { ...r, isResolved: true } : r))
    );
    toast.success("Section marked as resolved");
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Case Primary Header */}
      <CaseHeader
        id={applicationId || "CASE-2024-001"}
        title="Smart IoT Soil Moisture & Environmental Monitoring System"
        ipType="patent"
        status={caseStatus}
        applicantName="Dr. Maria Santos"
        department="College of Computing and Information Sciences"
        createdAt={new Date(Date.now() - 3600000 * 72).toISOString()}
        userRole="client"
        backUrl="/dashboard"
        onExport={() => toast.info("Exporting case summary PDF...")}
      />

      {/* Structured Revision Notice Banner if active */}
      {revisions.some((r) => !r.isResolved) && (
        <StructuredRevisionCard
          revisions={revisions}
          onResolveRevision={handleResolveRevision}
        />
      )}

      {/* Main Case Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto bg-slate-100/80 p-1 text-xs">
          <TabsTrigger value="overview" className="text-xs font-semibold px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs font-semibold px-4 py-2">Progress & Checklist</TabsTrigger>
          <TabsTrigger value="people" className="text-xs font-semibold px-4 py-2">Applicant & Inventors</TabsTrigger>
          <TabsTrigger value="research" className="text-xs font-semibold px-4 py-2">Research & IP Details</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold px-4 py-2">Documents</TabsTrigger>
          <TabsTrigger value="comments" className="text-xs font-semibold px-4 py-2">Comments & Revisions</TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-semibold px-4 py-2">Timeline Audit</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900">Case Overview & Executive Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-xs text-slate-700 space-y-3">
                <p className="leading-relaxed">
                  An automated soil moisture sensing apparatus integrating wireless sensor networks and low-power IoT microcontrollers to continuously analyze agricultural land hydration levels in real time.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Technical Field</span>
                    <span className="font-semibold text-slate-900">Agricultural Information Systems</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Funding Agency</span>
                    <span className="font-semibold text-slate-900">DOST-PCAARRD Institutional Grant</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <ProgressTracker
                steps={[
                  { id: "s1", title: "Applicant", status: "completed" },
                  { id: "s2", title: "Inventors", status: "completed" },
                  { id: "s3", title: "Research", status: "completed" },
                  { id: "s4", title: "IP Info", status: "warning" },
                  { id: "s5", title: "Documents", status: "completed" },
                  { id: "s6", title: "Review", status: "in_progress" },
                ]}
              />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PROGRESS & CHECKLIST */}
        <TabsContent value="progress" className="space-y-6">
          <CompletionChecklist
            items={[
              { key: "1", label: "Applicant Information Verified", isComplete: true, required: true },
              { key: "2", label: "Primary Inventor Disclosures", isComplete: true, required: true },
              { key: "3", label: "Research Abstract & Funding Details", isComplete: true, required: true },
              { key: "4", label: "Novelty & Claims Section", isComplete: false, required: true, missingNote: "Staff requested revision on Claim #2" },
              { key: "5", label: "Uploaded Technical Drawings", isComplete: true, required: true },
              { key: "6", label: "Signed Declaration of Ownership", isComplete: true, required: true },
            ]}
          />
        </TabsContent>

        {/* TAB 3: APPLICANT & INVENTORS */}
        <TabsContent value="people" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Applicant & Inventor Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="p-4 border rounded-lg bg-emerald-50/30 space-y-1">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  Primary Applicant
                </Badge>
                <h4 className="font-bold text-slate-900 text-sm pt-1">Dr. Maria Santos</h4>
                <p className="text-slate-600">Associate Professor, College of Computing and Information Sciences</p>
                <p className="text-slate-500 font-mono text-[11px]">msantos@carsu.edu.ph | +63 912 345 6789</p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900">Co-Inventors & Contributors</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg bg-slate-50">
                    <p className="font-bold text-slate-900">Engr. James Cruz</p>
                    <p className="text-slate-500 text-[11px]">Co-Inventor (40% Hardware Design)</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50">
                    <p className="font-bold text-slate-900">John Michael Doe</p>
                    <p className="text-slate-500 text-[11px]">Co-Inventor (20% Embedded Firmware)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: RESEARCH & IP DETAILS */}
        <TabsContent value="research" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Research & IP Details</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs text-slate-800">
              <div>
                <strong className="text-slate-900 block font-semibold mb-1">Technical Problem:</strong>
                <p className="p-3 bg-slate-50 border rounded-lg text-slate-700 leading-relaxed">
                  Existing soil moisture sensors suffer from rapid electrode corrosion in highly acidic soil conditions, leading to inaccurate readings and frequent replacement costs for farmers.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 block font-semibold mb-1">Technical Solution:</strong>
                <p className="p-3 bg-slate-50 border rounded-lg text-slate-700 leading-relaxed">
                  Our invention utilizes non-contact capacitive sensing encased in protective polymer shielding, coupled with pulse-frequency modulation to completely prevent galvanic oxidation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: DOCUMENTS */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Case Attachments & Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="p-3 border rounded-lg flex items-center justify-between text-xs bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-900">Technical_Drawings_Schematics_v1.pdf</p>
                    <p className="text-[11px] text-slate-400">2.4 MB • Uploaded 3 days ago</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: COMMENTS & REVISIONS */}
        <TabsContent value="comments" className="space-y-6">
          <SectionCommentThread
            sectionTitle="Claims & Novelty"
            sectionKey="ip_info"
            comments={comments}
            userRole="client"
            onAddComment={handleAddComment}
          />
        </TabsContent>

        {/* TAB 7: TIMELINE AUDIT */}
        <TabsContent value="history" className="space-y-6">
          <TimelineView events={timelineEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
