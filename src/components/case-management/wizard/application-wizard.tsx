"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProgressTracker, StepItem } from "../progress-tracker";
import { CompletionChecklist, ChecklistItem } from "../completion-checklist";
import { AutoSaveIndicator } from "../auto-save-indicator";
import { FileUploadCard } from "../file-upload-card";
import { ChevronLeft, ChevronRight, Send, Save, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface ApplicationWizardData {
  id?: string;
  ipType: string;
  // Step 1: Applicant
  applicantName: string;
  applicantEmail: string;
  contactNumber: string;
  department: string;
  mailingAddress: string;

  // Step 2: Inventors
  inventors: { name: string; email: string; contribution: string }[];

  // Step 3: Research
  researchTitle: string;
  abstract: string;
  fundingSource: string;
  fundingType: string;
  grantNumber: string;

  // Step 4: IP Info
  ipCategory: string;
  technicalProblem: string;
  technicalSolution: string;
  novelty: string;

  // Step 5: Documents
  uploadedFiles: { [key: string]: { name: string; size: number; type: string } };

  // Step 6: Declarations
  declarationAgreed: boolean;
  signatureName: string;
}

const WIZARD_STEPS: StepItem[] = [
  { id: "applicant", title: "Applicant Info", status: "incomplete" },
  { id: "inventors", title: "Inventors Info", status: "incomplete" },
  { id: "research", title: "Research Details", status: "incomplete" },
  { id: "ip_info", title: "IP Information", status: "incomplete" },
  { id: "documents", title: "Documents", status: "incomplete" },
  { id: "declaration", title: "Declaration", status: "incomplete" },
  { id: "review", title: "Review & Submit", status: "incomplete" },
];

export interface ApplicationWizardProps {
  initialData?: Partial<ApplicationWizardData>;
  onSaveDraft?: (data: ApplicationWizardData) => Promise<void>;
  onSubmitApplication?: (data: ApplicationWizardData) => Promise<void>;
  onCancel?: () => void;
}

export function ApplicationWizard({
  initialData,
  onSaveDraft,
  onSubmitApplication,
  onCancel,
}: ApplicationWizardProps) {
  const router = useRouter();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [formData, setFormData] = useState<ApplicationWizardData>({
    ipType: initialData?.ipType || "patent",
    applicantName: initialData?.applicantName || "",
    applicantEmail: initialData?.applicantEmail || "",
    contactNumber: initialData?.contactNumber || "",
    department: initialData?.department || "College of Computing and Information Sciences",
    mailingAddress: initialData?.mailingAddress || "",

    inventors: initialData?.inventors || [{ name: "", email: "", contribution: "" }],

    researchTitle: initialData?.researchTitle || "",
    abstract: initialData?.abstract || "",
    fundingSource: initialData?.fundingSource || "",
    fundingType: initialData?.fundingType || "internal",
    grantNumber: initialData?.grantNumber || "",

    ipCategory: initialData?.ipCategory || "",
    technicalProblem: initialData?.technicalProblem || "",
    technicalSolution: initialData?.technicalSolution || "",
    novelty: initialData?.novelty || "",

    uploadedFiles: initialData?.uploadedFiles || {},

    declarationAgreed: initialData?.declarationAgreed || false,
    signatureName: initialData?.signatureName || "",
  });

  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "unsaved" | "error">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save debounced effect when inputs change
  useEffect(() => {
    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      if (onSaveDraft) {
        setSaveStatus("saving");
        try {
          await onSaveDraft(formData);
          setSaveStatus("saved");
          setLastSavedAt(new Date());
        } catch {
          setSaveStatus("error");
        }
      } else {
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = (key: keyof ApplicationWizardData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Evaluate step completion status
  const stepsWithStatus: StepItem[] = WIZARD_STEPS.map((step, idx) => {
    let isDone = false;
    switch (step.id) {
      case "applicant":
        isDone = !!(formData.applicantName && formData.applicantEmail);
        break;
      case "inventors":
        isDone = formData.inventors.length > 0 && !!formData.inventors[0].name;
        break;
      case "research":
        isDone = !!(formData.researchTitle && formData.abstract);
        break;
      case "ip_info":
        isDone = !!(formData.technicalProblem && formData.technicalSolution);
        break;
      case "documents":
        isDone = Object.keys(formData.uploadedFiles).length > 0;
        break;
      case "declaration":
        isDone = formData.declarationAgreed && !!formData.signatureName;
        break;
      case "review":
        isDone = false;
        break;
    }
    return {
      ...step,
      status: idx === currentStepIdx ? "in_progress" : isDone ? "completed" : "incomplete",
    };
  });

  // Completion checklist items for review step
  const checklistItems: ChecklistItem[] = [
    { key: "c1", label: "Applicant Name & Email", isComplete: !!(formData.applicantName && formData.applicantEmail), required: true, targetStepId: "applicant" },
    { key: "c2", label: "At least 1 Primary Inventor", isComplete: formData.inventors.length > 0 && !!formData.inventors[0].name, required: true, targetStepId: "inventors" },
    { key: "c3", label: "Research Title & Abstract", isComplete: !!(formData.researchTitle && formData.abstract), required: true, targetStepId: "research" },
    { key: "c4", label: "Technical Problem & Solution", isComplete: !!(formData.technicalProblem && formData.technicalSolution), required: true, targetStepId: "ip_info" },
    { key: "c5", label: "Supporting Documents Uploaded", isComplete: Object.keys(formData.uploadedFiles).length > 0, required: true, targetStepId: "documents" },
    { key: "c6", label: "Signed Legal Declaration", isComplete: formData.declarationAgreed && !!formData.signatureName, required: true, targetStepId: "declaration" },
  ];

  const currentStep = WIZARD_STEPS[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < WIZARD_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepId: string) => {
    const idx = WIZARD_STEPS.findIndex((s) => s.id === stepId);
    if (idx !== -1) setCurrentStepIdx(idx);
  };

  const handleSubmit = async () => {
    const incomplete = checklistItems.filter((item) => !item.isComplete);
    if (incomplete.length > 0) {
      toast.error("Please complete all required fields before submission.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmitApplication) {
        await onSubmitApplication(formData);
      }
      toast.success("Application submitted successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Save Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Guided IP Application Wizard</h1>
          <p className="text-xs text-slate-500">Step-by-step application builder with auto-saving</p>
        </div>

        <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {/* Persistent Progress Tracker */}
      <ProgressTracker
        steps={stepsWithStatus}
        currentStepId={currentStep.id}
        onStepClick={handleStepClick}
      />

      {/* Step Content Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>
              Step {currentStepIdx + 1}: {currentStep.title}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              Step {currentStepIdx + 1} of {WIZARD_STEPS.length}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* STEP 1: Applicant Info */}
          {currentStep.id === "applicant" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Applicant Full Name *</Label>
                  <Input
                    placeholder="e.g. Dr. Maria Santos"
                    value={formData.applicantName}
                    onChange={(e) => updateField("applicantName", e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="e.g. msantos@carsu.edu.ph"
                    value={formData.applicantEmail}
                    onChange={(e) => updateField("applicantEmail", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Contact Phone Number</Label>
                  <Input
                    placeholder="e.g. +63 912 345 6789"
                    value={formData.contactNumber}
                    onChange={(e) => updateField("contactNumber", e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">College / Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mailing Address</Label>
                <Textarea
                  placeholder="Caraga State University, Ampayon, Butuan City..."
                  value={formData.mailingAddress}
                  onChange={(e) => updateField("mailingAddress", e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Inventors */}
          {currentStep.id === "inventors" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">List all authors or inventors who contributed to this IP creation.</p>
              {formData.inventors.map((inv, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800">Inventor #{idx + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Full Name"
                      value={inv.name}
                      onChange={(e) => {
                        const updated = [...formData.inventors];
                        updated[idx].name = e.target.value;
                        updateField("inventors", updated);
                      }}
                      className="text-xs bg-white"
                    />
                    <Input
                      placeholder="Email"
                      value={inv.email}
                      onChange={(e) => {
                        const updated = [...formData.inventors];
                        updated[idx].email = e.target.value;
                        updateField("inventors", updated);
                      }}
                      className="text-xs bg-white"
                    />
                    <Input
                      placeholder="Contribution % or Role"
                      value={inv.contribution}
                      onChange={(e) => {
                        const updated = [...formData.inventors];
                        updated[idx].contribution = e.target.value;
                        updateField("inventors", updated);
                      }}
                      className="text-xs bg-white"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField("inventors", [
                    ...formData.inventors,
                    { name: "", email: "", contribution: "" },
                  ])
                }
                className="text-xs"
              >
                + Add Another Inventor
              </Button>
            </div>
          )}

          {/* STEP 3: Research */}
          {currentStep.id === "research" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Research / Invention Title *</Label>
                <Input
                  placeholder="e.g. Smart IoT Soil Moisture Monitoring Device"
                  value={formData.researchTitle}
                  onChange={(e) => updateField("researchTitle", e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Executive Abstract / Description *</Label>
                <Textarea
                  placeholder="Provide a comprehensive summary of the research project..."
                  value={formData.abstract}
                  onChange={(e) => updateField("abstract", e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Funding Source</Label>
                  <Input
                    placeholder="e.g. DOST / CHED Grant"
                    value={formData.fundingSource}
                    onChange={(e) => updateField("fundingSource", e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Funding Type</Label>
                  <Select
                    value={formData.fundingType}
                    onValueChange={(val) => updateField("fundingType", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">CSU Institutional</SelectItem>
                      <SelectItem value="external">Government Grant</SelectItem>
                      <SelectItem value="private">Private Sponsorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Grant Number</Label>
                  <Input
                    placeholder="e.g. GR-2024-889"
                    value={formData.grantNumber}
                    onChange={(e) => updateField("grantNumber", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: IP Info */}
          {currentStep.id === "ip_info" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Technical Problem Addressed *</Label>
                <Textarea
                  placeholder="Describe the existing limitations or technical gaps addressed..."
                  value={formData.technicalProblem}
                  onChange={(e) => updateField("technicalProblem", e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Technical Solution & Operation *</Label>
                <Textarea
                  placeholder="Explain how your solution works and solves the problem..."
                  value={formData.technicalSolution}
                  onChange={(e) => updateField("technicalSolution", e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Novelty & Key Advantages</Label>
                <Textarea
                  placeholder="What makes this invention unique compared to existing prior art?"
                  value={formData.novelty}
                  onChange={(e) => updateField("novelty", e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Supporting Documents */}
          {currentStep.id === "documents" && (
            <div className="space-y-4">
              <FileUploadCard
                label="Technical Drawings & Schematics"
                description="Upload architectural diagrams, circuit schematics, or CAD files"
                onFileSelect={(file) =>
                  updateField("uploadedFiles", {
                    ...formData.uploadedFiles,
                    drawings: { name: file.name, size: file.size, type: file.type },
                  })
                }
                file={formData.uploadedFiles.drawings || null}
              />

              <FileUploadCard
                label="Proof of CSU Affiliation / ID"
                description="Upload copy of CSU Faculty / Student ID card"
                onFileSelect={(file) =>
                  updateField("uploadedFiles", {
                    ...formData.uploadedFiles,
                    id_card: { name: file.name, size: file.size, type: file.type },
                  })
                }
                file={formData.uploadedFiles.id_card || null}
              />
            </div>
          )}

          {/* STEP 6: Declarations */}
          {currentStep.id === "declaration" && (
            <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
              <h4 className="text-xs font-bold text-slate-900">Legal Ownership Declaration</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                I hereby declare that the statements made herein are true and accurate to the best of my knowledge, and that I am authorized to submit this Intellectual Property Disclosure to the CSU Technology Transfer and Licensing Office.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="decl"
                  checked={formData.declarationAgreed}
                  onCheckedChange={(checked) => updateField("declarationAgreed", !!checked)}
                />
                <Label htmlFor="decl" className="text-xs font-medium cursor-pointer">
                  I agree to the terms and legal declarations.
                </Label>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold">Digital Signature Full Name *</Label>
                <Input
                  placeholder="Type your full legal name as signature"
                  value={formData.signatureName}
                  onChange={(e) => updateField("signatureName", e.target.value)}
                  className="text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 7: Review & Submit */}
          {currentStep.id === "review" && (
            <div className="space-y-6">
              <CompletionChecklist
                items={checklistItems}
                onNavigateToStep={handleStepClick}
              />

              <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-2">
                <h4 className="font-bold text-slate-900">Application Summary Preview</h4>
                <p><strong>Title:</strong> {formData.researchTitle || "Not specified"}</p>
                <p><strong>Applicant:</strong> {formData.applicantName} ({formData.applicantEmail})</p>
                <p><strong>IP Type:</strong> {formData.ipType.toUpperCase()}</p>
                <p><strong>Inventors:</strong> {formData.inventors.map((i) => i.name).filter(Boolean).join(", ") || "None"}</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-100 flex items-center justify-between p-4 bg-slate-50/60">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="text-xs h-9 gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} className="text-xs h-9">
                Cancel
              </Button>
            )}

            {currentStepIdx < WIZARD_STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext} className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-xs h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
              >
                <Send className="w-4 h-4" />
                Submit Case Application
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
