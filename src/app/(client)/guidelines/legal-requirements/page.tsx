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
  Scale,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LegalRequirementsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Legal Requirements
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about the legal obligations, requirements, and
          compliance considerations for different types of intellectual property
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
            <Scale className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Compliance</span>
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
              UNDERSTANDING LEGAL OBLIGATIONS
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Legal requirements for intellectual property protection vary by
              type and jurisdiction. Understanding and complying with these
              requirements is crucial for securing and maintaining your IP
              rights effectively.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "Compliance with legal requirements is not just about
                    following rules - it's about building a strong foundation
                    for your intellectual property rights."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — IP LEGAL OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              Importance of Legal Compliance
            </h3>
            <p className="text-gray-700 leading-relaxed text-base mb-6">
              Meeting legal requirements for intellectual property is essential
              not only for initial protection but also for maintaining and
              enforcing your rights. Proper legal compliance ensures your IP
              assets are defensible in case of disputes or litigation.
            </p>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                Failure to comply with legal requirements may result in
                unenforceable IP rights, rejected applications, or vulnerability
                to challenges from third parties.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            LEGAL REQUIREMENTS BY IP TYPE
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Patent Legal Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Novelty:</span> The
                    invention must be new and not previously disclosed to the
                    public in any form anywhere in the world before the filing
                    date
                  </li>
                  <li>
                    <span className="font-semibold">Non-obviousness:</span> The
                    invention must not be obvious to a person having ordinary
                    skill in the relevant technical field
                  </li>
                  <li>
                    <span className="font-semibold">Utility:</span> The
                    invention must have a useful purpose and operability (be
                    capable of performing its intended purpose)
                  </li>
                  <li>
                    <span className="font-semibold">Enablement:</span> The
                    patent application must describe the invention in sufficient
                    detail to enable a person skilled in the field to make and
                    use it
                  </li>
                  <li>
                    <span className="font-semibold">Best mode:</span> The
                    inventor must disclose the best mode contemplated for
                    carrying out the invention
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Trademark Legal Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Distinctiveness:</span> The
                    mark must be capable of distinguishing the applicant's
                    goods/services from those of others
                  </li>
                  <li>
                    <span className="font-semibold">Use in commerce:</span> The
                    mark must be used in commerce or there must be a bona fide
                    intent to use it in commerce
                  </li>
                  <li>
                    <span className="font-semibold">No confusion:</span> The
                    mark must not be likely to cause confusion with existing
                    registered marks
                  </li>
                  <li>
                    <span className="font-semibold">
                      Not merely descriptive:
                    </span>{" "}
                    The mark cannot simply describe the goods/services it
                    identifies
                  </li>
                  <li>
                    <span className="font-semibold">Not generic:</span> The mark
                    cannot be the generic name for the product or service it
                    identifies
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Copyright Legal Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Original work:</span> The
                    work must be an original creation of the author
                  </li>
                  <li>
                    <span className="font-semibold">Fixed form:</span> The work
                    must be fixed in a tangible medium of expression
                  </li>
                  <li>
                    <span className="font-semibold">Minimum creativity:</span>{" "}
                    The work must exhibit at least a minimal degree of
                    creativity
                  </li>
                  <li>
                    <span className="font-semibold">
                      Registration (optional):
                    </span>{" "}
                    While not required for protection, registration provides
                    legal advantages like the ability to sue for infringement
                  </li>
                  <li>
                    <span className="font-semibold">Deposit requirements:</span>{" "}
                    When registering, copyright law requires submission of
                    deposit copies to the Copyright Office
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Trade Secret Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    <span className="font-semibold">Economic value:</span> The
                    information must derive independent economic value from not
                    being generally known
                  </li>
                  <li>
                    <span className="font-semibold">Secrecy measures:</span>{" "}
                    Reasonable steps must be taken to maintain its secrecy
                  </li>
                  <li>
                    <span className="font-semibold">Not public knowledge:</span>{" "}
                    The information must not be readily ascertainable through
                    proper means
                  </li>
                  <li>
                    <span className="font-semibold">
                      Confidentiality agreements:
                    </span>{" "}
                    Proper agreements should be in place with all parties having
                    access to the secret
                  </li>
                  <li>
                    <span className="font-semibold">Security protocols:</span>{" "}
                    Physical and digital security measures must be implemented
                    to protect the information
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            ENSURING COMPLIANCE
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Documentation & Record Keeping
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  Proper documentation is essential for demonstrating compliance
                  with legal requirements:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Maintain detailed development records for inventions and
                    creative works
                  </li>
                  <li>
                    Document dates of creation, first use, and public disclosure
                  </li>
                  <li>
                    Keep signed inventor/author declarations and assignments
                  </li>
                  <li>Preserve evidence of trademark use in commerce</li>
                  <li>
                    Maintain records of security measures for trade secrets
                  </li>
                  <li>Organize all official communications with IP offices</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Regular Audits & Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  Implementing a regular audit schedule helps ensure ongoing
                  compliance:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Conduct annual IP portfolio reviews</li>
                  <li>Verify all maintenance fees and renewals are current</li>
                  <li>
                    Review and update security protocols for confidential
                    information
                  </li>
                  <li>
                    Assess trademark use to ensure consistency with registration
                  </li>
                  <li>
                    Update licenses and agreements to reflect current laws
                  </li>
                  <li>Check for potential infringement by third parties</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Contracts & Agreements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  Legal agreements are crucial for IP compliance:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Employment agreements with IP assignment clauses</li>
                  <li>
                    Non-disclosure agreements for confidential information
                  </li>
                  <li>Work-for-hire agreements for copyrighted works</li>
                  <li>Licensing agreements with quality control provisions</li>
                  <li>
                    Joint development agreements with clear IP ownership terms
                  </li>
                  <li>
                    Consultant agreements with proper IP rights provisions
                  </li>
                </ul>
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
                  How do legal requirements differ internationally?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  While there are international treaties that harmonize some
                  aspects of IP law (like the Paris Convention, TRIPS, and the
                  Berne Convention), significant differences still exist between
                  jurisdictions. For example, the United States has a grace
                  period for patent disclosures, while many other countries do
                  not. Some jurisdictions require proof of use for trademarks,
                  while others do not. Copyright formalities also vary widely.
                  It's essential to understand specific requirements in each
                  country where you seek protection.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  What happens if I accidentally disclose my invention before
                  filing a patent?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  The consequences depend on where you plan to file. In the
                  United States, you have a one-year grace period from your
                  first public disclosure to file a patent application. However,
                  in most other countries, any public disclosure before filing
                  invalidates your ability to obtain a patent (absolute novelty
                  requirement). If you've disclosed your invention, consult with
                  an IP attorney immediately to understand your options,
                  including possible emergency filings in countries with grace
                  periods.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Do I need to use the © copyright symbol to protect my work?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  In countries that are members of the Berne Convention (most
                  countries worldwide), copyright protection is automatic upon
                  creation of the work in fixed form - no registration or
                  copyright notice is required. However, using the © symbol,
                  year of first publication, and copyright owner's name (e.g.,
                  "© 2023 Jane Doe") is still recommended as it informs others
                  that copyright is claimed, prevents a "innocent infringement"
                  defense, and may be required for full protection in a few
                  countries that aren't Berne signatories.
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
                  Step-by-step guidance for filing IP applications properly
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
                  Requirements for maintaining your IP rights over time
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/introduction">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  IP Introduction
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Overview of intellectual property protection types
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
