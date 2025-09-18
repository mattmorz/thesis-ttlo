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
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PatentGuidelinesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Patent Guidelines
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about patent protection, filing requirements,
          and procedures for securing your inventions.
        </p>
      </div>

      <Separator className="my-6 bg-gray-200" />

      {/* Content Tabs */}
      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="w-full max-w-[750px] p-1 bg-gray-100 rounded-lg mx-auto flex justify-center">
          <TabsTrigger
            value="basics"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Book className="h-4 w-4" />
            <span>Basics</span>
          </TabsTrigger>
          <TabsTrigger
            value="requirements"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="process"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <InfoIcon className="h-4 w-4" />
            <span>Process</span>
          </TabsTrigger>
          <TabsTrigger
            value="examples"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Lightbulb className="h-4 w-4" />
            <span>Examples</span>
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-8 mt-6">
          <section>
            <h2 className="text-2xl font-medium mb-4 text-gray-800">
              WHAT IS A PATENT?
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              A patent is an exclusive right granted for an invention, which is
              a product or a process that provides a new technical solution to a
              problem or offers a new way of doing something. To get a patent,
              technical information about the invention must be disclosed to the
              public in a patent application.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "Patents foster innovation by providing inventors with the
                    opportunity to benefit financially from their inventions,
                    encouraging further innovation."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — INTELLECTUAL PROPERTY OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              Types of Patents
            </h3>
            <p className="text-gray-700 leading-relaxed text-base mb-6">
              There are generally three types of patents that serve different
              purposes:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Utility Patents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Protect the functional aspects of an invention and how it
                    works. These are the most common type of patents.
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Design Patents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Protect the ornamental appearance of an article of
                    manufacture rather than its function.
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Plant Patents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Protect new varieties of plants that can be reproduced
                    asexually (not by seeds).
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                Patent protection is territorial, meaning it only applies in the
                country or region where the patent was granted.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            PATENT REQUIREMENTS
          </h2>

          <p className="text-gray-700 leading-relaxed text-base mb-6">
            For an invention to be patentable, it must satisfy the following key
            criteria:
          </p>

          <div className="space-y-4">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Novelty
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-gray-700">
                  The invention must be new and not previously disclosed to the
                  public in any form. Prior disclosure, even by the inventor,
                  may prevent patent protection.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Non-obviousness (Inventive Step)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-gray-700">
                  The invention must not be obvious to a person skilled in the
                  relevant field. It should demonstrate ingenuity beyond
                  ordinary skill.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Industrial Applicability (Utility)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-gray-700">
                  The invention must have a practical use and be capable of
                  being made or used in some kind of industry.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Patentable Subject Matter
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-gray-700">
                  The invention must fall within the categories of patentable
                  subject matter defined by law. Abstract ideas, laws of nature,
                  and natural phenomena are typically excluded.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="process" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            PATENT APPLICATION PROCESS
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 1: Preliminary Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Before filing, conduct a thorough patent search to determine
                  if your invention is novel. Consult with a patent professional
                  if necessary. Consider filing a provisional application to
                  secure an early filing date.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 2: Prepare the Application
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed mb-3">
                  Prepare a complete patent application including:
                </p>
                <ul className="list-disc pl-8 space-y-2 text-gray-700">
                  <li>Specification (detailed description of the invention)</li>
                  <li>Claims (define the legal scope of protection)</li>
                  <li>Drawings (if necessary to understand the invention)</li>
                  <li>Abstract (brief summary of the invention)</li>
                  <li>Filing fees</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 3: Filing and Examination
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  File the application with the appropriate patent office. After
                  filing, the application undergoes formal examination to ensure
                  compliance with requirements, followed by substantive
                  examination to assess patentability.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 4: Publication and Grant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  If the examination is successful and any objections are
                  overcome, the patent will be granted. Patent applications are
                  typically published 18 months after filing, regardless of
                  whether they have been granted yet.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            EXAMPLES OF PATENTABLE INVENTIONS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  New Medical Device
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  A novel surgical instrument that improves precision during
                  operations, with specific mechanical components and
                  operational features that differentiate it from existing
                  tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Chemical Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  A new pharmaceutical compound with unique therapeutic
                  properties, including specific chemical structure, synthesis
                  method, and medical applications.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Technical Process
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  An innovative manufacturing method that significantly improves
                  efficiency, reduces waste, or enables new capabilities not
                  possible with existing processes.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Software-Related Invention
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  A technical solution implemented in software that solves a
                  specific technical problem, such as improving computer
                  functionality or network security.
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
                  How long does patent protection last?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Generally, utility patents provide protection for 20 years
                  from the filing date, while design patents typically last for
                  15 years from the date of grant. Maintenance fees are required
                  to keep utility patents in force.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  When should I file a patent application?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  File as soon as your invention is sufficiently developed and
                  before any public disclosure. In most countries, public
                  disclosure before filing may prevent you from obtaining a
                  patent.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  What rights does a patent provide?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  A patent gives you the exclusive right to prevent others from
                  making, using, selling, or importing your invention in the
                  country where the patent is granted. You can license these
                  rights to others or sell the patent outright.
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
          <Link href="/guidelines/filing-procedures">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Filing Procedures
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Step-by-step guide to submitting your patent application
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
                  How to maintain your patent protection over time
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/legal-requirements">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Legal Requirements
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Legal considerations and compliance information
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
