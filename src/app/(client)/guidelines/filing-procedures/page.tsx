"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  InfoIcon,
  FileText,
  Book,
  HelpCircle,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FilingProceduresPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Filing Procedures
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about the application process, required
          documentation, and timelines for securing intellectual property
          protection.
        </p>
      </div>

      <Separator className="my-6 bg-gray-200" />

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full max-w-[600px] p-1 bg-gray-100 rounded-lg mx-auto flex justify-center">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Book className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="requirements"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="steps"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>Steps</span>
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-6">
          <section>
            <h2 className="text-2xl font-medium mb-4 text-gray-800">
              UNDERSTANDING THE FILING PROCESS
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Filing for intellectual property protection requires careful
              attention to detail and following specific procedures. The process
              varies depending on the type of IP protection you're seeking and
              the jurisdiction where you're filing.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "A well-prepared IP filing is the foundation of strong
                    intellectual property protection."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — IP OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              IP Filing Considerations
            </h3>
            <p className="text-gray-700 leading-relaxed text-base mb-6">
              Each type of intellectual property has its own distinct filing
              procedures, requirements, and timeframes. However, there are
              common elements that apply across different IP types that are
              important to understand before beginning the process.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Timing Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700 mb-3">
                    Filing timing can significantly impact your IP rights:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>First-to-file principles in many jurisdictions</li>
                    <li>Priority claim deadlines (typically 6-12 months)</li>
                    <li>Public disclosure implications</li>
                    <li>Application processing timelines</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Jurisdictional Scope
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700 mb-3">
                    Consider where you need protection:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Domestic vs. international protection</li>
                    <li>Regional vs. country-by-country filing</li>
                    <li>International treaties and agreements</li>
                    <li>Enforcement capabilities in different regions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                Consider consulting with an IP professional before filing to
                ensure you follow the proper procedures and maximize your
                protection.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            FILING REQUIREMENTS BY IP TYPE
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Patent Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    Specification with detailed description of the invention
                  </li>
                  <li>Claims defining the legal scope of protection</li>
                  <li>
                    Drawings (where necessary to understand the invention)
                  </li>
                  <li>Abstract summarizing the invention</li>
                  <li>Declaration/oath of inventorship</li>
                  <li>
                    Information disclosure statement listing relevant prior art
                  </li>
                  <li>Filing, search, and examination fees</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Trademark Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>Clear representation of the mark</li>
                  <li>List of goods/services associated with the mark</li>
                  <li>
                    Specimen showing the mark in use (for use-based
                    applications)
                  </li>
                  <li>Basis for filing (use in commerce or intent to use)</li>
                  <li>Application form and declaration</li>
                  <li>Filing fees per class of goods/services</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Copyright Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>Completed application form</li>
                  <li>Deposit copy of the work being registered</li>
                  <li>Filing fee</li>
                  <li>Declaration of authorship or ownership</li>
                  <li>Publication details (if published)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            FILING PROCESS STEPS
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 1: Pre-Filing Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Before filing, conduct preliminary searches to determine if
                  your IP is eligible for protection. For patents, conduct a
                  prior art search; for trademarks, perform a clearance search;
                  and for copyrights, check existing registrations. This helps
                  identify potential conflicts and refine your application.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 2: Prepare Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Gather and prepare all required documentation for your
                  specific IP type. This may include detailed descriptions,
                  drawings, specimens, or copies of the work. Pay careful
                  attention to format requirements and ensure all information is
                  accurate and complete.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 3: Submit Application
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  File your application with the appropriate IP office along
                  with required fees. Applications can typically be filed online
                  through the IP office's electronic filing system, which often
                  provides guided assistance. Keep records of your filing,
                  including receipt and application numbers.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 4: Respond to Office Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  After filing, your application will be examined for compliance
                  with requirements. The examiner may issue office actions
                  requesting clarification or modifications. Respond to these
                  promptly within specified deadlines to avoid abandonment of
                  your application.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 5: Finalize Registration or Grant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Once all requirements are met and examinations complete, your
                  IP will either be registered (trademarks, copyrights) or
                  granted (patents). Pay any final fees required and note
                  important dates for future maintenance requirements or
                  renewals.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <div className="space-y-5">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  How long does the IP filing process take?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Timeframes vary by IP type and jurisdiction. Copyright
                  registrations are typically processed within 3-9 months.
                  Trademark registrations generally take 8-12 months if no
                  office actions are issued. Patent applications have the
                  longest timeline, often 18-36 months or more depending on
                  complexity and jurisdiction.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Do I need a lawyer to file an IP application?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  While not always legally required, professional assistance is
                  highly recommended, especially for patents. Patent
                  applications involve complex technical and legal requirements,
                  and professional drafting can significantly impact the scope
                  and strength of protection. Trademarks and copyrights have
                  simpler applications, but professional guidance can still help
                  avoid common pitfalls.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  What happens if my application is rejected?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Rejections are often not final. For patents and trademarks,
                  you can respond to office actions by addressing examiner
                  concerns, amending your application, or providing arguments
                  for reconsideration. If still unsuccessful, various appeal
                  options are available. For copyrights, rejections are less
                  common but can be addressed by correcting identified
                  deficiencies and resubmitting.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-8 bg-gray-200" />

      {/* Related Guidelines */}
      <div>
        <h2 className="text-2xl font-medium mb-6 text-gray-800">
          Related Guidelines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/guidelines/patent">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Patent Guidelines
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Specific information about patent application requirements
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/trademark">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Trademark Guidelines
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Details on trademark application and registration process
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/maintenance-and-renewals">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Maintenance & Renewal
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  What to do after your IP application is approved
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Feedback Section */}
      <Card className="mt-10 border bg-gray-50 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium mb-4 text-gray-800">
            Was this information helpful?
          </h3>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#F9FFF9]"
            >
              Yes, it was helpful
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#F9FFF9]"
            >
              No, I need more information
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
