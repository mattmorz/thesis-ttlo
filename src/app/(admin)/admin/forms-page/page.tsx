"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Import the PDF generator with the correct path
import generateDeedOfAssignmentPdf from "./forms/DeedofAssignmentPdf";
import generateClientProfilePdf from "./forms/ClientProfilePdf";
import generateSubstantialUsePdf from "./forms/SubstantialUsePdf";
import generateIPDisclosurePdf from "./forms/IPDisclosurePdf";
import generatePatentSearchReportPdf from "./forms/PatentSearchReportPdf";
import generateMatrixSamplePdf from "./forms/MatrixSamplePdf";

export default function DocumentGenerationPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerateDeed = async () => {
    setIsGenerating("deed");
    try {
      // Call the generator function without passing any data
      await generateDeedOfAssignmentPdf("");
      toast.success("Deed of Assignment generated successfully");
    } catch (error) {
      console.error("Error generating Deed of Assignment:", error);
      toast.error("Failed to generate Deed of Assignment");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateClientProfile = async () => {
    setIsGenerating("profile");
    try {
      // Call the generator function without passing any data
      await generateClientProfilePdf();
      toast.success("Client Profile generated successfully");
    } catch (error) {
      console.error("Error generating Client Profile:", error);
      toast.error("Failed to generate Client Profile");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateCertificate = async () => {
    setIsGenerating("certificate");
    try {
      await generateSubstantialUsePdf("");
      toast.success("Certificate of Substantial Use generated successfully");
    } catch (error) {
      console.error("Error generating Certificate:", error);
      toast.error("Failed to generate Certificate");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateIpDisclosure = async () => {
    setIsGenerating("disclosure");
    try {
      await generateIPDisclosurePdf("");
      toast.success("IP Disclosure generated successfully");
    } catch (error) {
      console.error("Error generating IP Disclosure:", error);
      toast.error("Failed to generate IP Disclosure");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGeneratePatentSearchReport = async () => {
    setIsGenerating("patentSearch");
    try {
      // Use the actual PDF generator function instead of setTimeout
      await generatePatentSearchReportPdf();
      toast.success("Patent Search Report generated successfully");
    } catch (error) {
      console.error("Error generating Patent Search Report:", error);
      toast.error("Failed to generate Patent Search Report");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateMatrixSample = async () => {
    setIsGenerating("matrix");
    try {
      // Use the actual PDF generator function instead of setTimeout
      await generateMatrixSamplePdf();
      toast.success("Matrix Sample generated successfully");
    } catch (error) {
      console.error("Error generating Matrix Sample:", error);
      toast.error("Failed to generate Matrix Sample");
    } finally {
      setIsGenerating(null);
    }
  };


  return (
    <div className=" mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deed of Assignment Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Deed of Assignment</CardTitle>
              </div>
              <div className="bg-green-50 rounded-full p-2">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Contains creator and assignee details</span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Legal binding document</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateDeed}
              disabled={isGenerating === "deed"}
              className="w-full"
            >
              {isGenerating === "deed" ? (
                "Generating..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Client Profile Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Client Profile</CardTitle>
              </div>
              <div className="bg-blue-50 rounded-full p-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
              <span>Contact information</span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
              <span>Project history</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateClientProfile}
              disabled={isGenerating === "profile"}
              className="w-full"
              variant="outline"
            >
              {isGenerating === "profile" ? (
                "Generating..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Certificate of Substantial Use */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  Certificate of Substantial Use
                </CardTitle>
              </div>
              <div className="bg-amber-50 rounded-full p-2">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-amber-500 mr-2" />
              <span>Usage validation</span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-amber-500 mr-2" />
              <span>Implementation details</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateCertificate}
              disabled={isGenerating === "certificate"}
              className="w-full"
              variant="outline"
            >
              {isGenerating === "certificate" ? (
                "Generating..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* IP Disclosure Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">IP Disclosure</CardTitle>
              </div>
              <div className="bg-purple-50 rounded-full p-2">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
              <span>Technical specifications</span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
              <span>Commercial potential</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateIpDisclosure}
              disabled={isGenerating === "disclosure"}
              className="w-full"
              variant="outline"
            >
              {isGenerating === "disclosure" ? (
                "Generating..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Patent Search Report Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Patent Search Report</CardTitle>
              </div>
              <div className="bg-red-50 rounded-full p-2">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-red-500 mr-2" />
              <span>Prior art analysis</span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-red-500 mr-2" />
              <span>Patentability assessment</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGeneratePatentSearchReport}
              disabled={isGenerating === "patentSearch"}
              className="w-full"
              variant="outline"
            >
              {isGenerating === "patentSearch" ? (
                "Generating..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Matrix Sample Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Matrix Sample</CardTitle>
              </div>
              <div className="bg-teal-50 rounded-full p-2">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-teal-500 mr-2" />
              <span>Comparative analysis</span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-teal-500 mr-2" />
              <span>Classification framework</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateMatrixSample}
              disabled={isGenerating === "matrix"}
              className="w-full"
              variant="outline"
            >
              {isGenerating === "matrix" ? (
                "Generating..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
