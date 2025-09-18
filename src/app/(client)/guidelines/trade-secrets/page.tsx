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
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TradeSecretsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Trade Secrets
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about protecting confidential business
          information that provides competitive advantage in the marketplace.
        </p>
      </div>

      <Separator className="my-6 bg-gray-200" />

      {/* Content Tabs */}
      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="w-full max-w-[600px] p-1 bg-gray-100 rounded-lg mx-auto flex justify-center">
          <TabsTrigger
            value="basics"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Book className="h-4 w-4" />
            <span>Basics</span>
          </TabsTrigger>
          <TabsTrigger
            value="protection"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Lock className="h-4 w-4" />
            <span>Protection</span>
          </TabsTrigger>
          <TabsTrigger
            value="management"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>Management</span>
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
              WHAT ARE TRADE SECRETS?
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Trade secrets are confidential business information that provides
              a competitive advantage. This includes formulas, practices,
              processes, designs, instruments, patterns, or compilations of
              information that are not generally known or reasonably
              ascertainable by others.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "In the world of business, the people who know the most
                    succeed the most."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — TRADE SECRET PROTECTION
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              Common Types of Trade Secrets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Technical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Manufacturing processes and techniques</li>
                    <li>Chemical formulas and recipes</li>
                    <li>Research and development data</li>
                    <li>Software algorithms and source code</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Customer lists and data</li>
                    <li>Pricing strategies and cost information</li>
                    <li>Business plans and marketing strategies</li>
                    <li>Supplier relationships and terms</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                Unlike patents or copyrights, trade secrets have no expiration
                date and can last indefinitely as long as they remain secret and
                provide value.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="protection" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            REQUIREMENTS FOR PROTECTION
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Economic Value
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The information must derive independent economic value from
                  not being generally known to, and not being readily
                  ascertainable by proper means by, others who could obtain
                  economic value from its disclosure or use.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Secrecy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The information must be secret and not generally known or
                  readily ascertainable by the relevant public. Once information
                  becomes public, it loses trade secret protection.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Reasonable Measures
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The owner must take reasonable steps to maintain secrecy.
                  These may include confidentiality agreements, physical
                  security measures, employee training, and proper information
                  classification systems.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            TRADE SECRET MANAGEMENT
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Contractual Protections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Non-disclosure agreements (NDAs) with employees,
                    contractors, and business partners
                  </li>
                  <li>Confidentiality clauses in employment contracts</li>
                  <li>Non-compete agreements (where legally enforceable)</li>
                  <li>
                    Work-for-hire and intellectual property assignment
                    agreements
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Physical Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Restricted access to sensitive areas</li>
                  <li>Visitor management systems</li>
                  <li>Secure document storage and disposal (shredding)</li>
                  <li>Clear-desk policies</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Digital Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Access controls and user permissions</li>
                  <li>Data encryption</li>
                  <li>Information classification systems</li>
                  <li>Network security and monitoring</li>
                  <li>Secure file sharing protocols</li>
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
                  What legal remedies are available for trade secret
                  misappropriation?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Legal remedies include injunctive relief to prevent further
                  disclosure, monetary damages for actual losses and unjust
                  enrichment, reasonable royalties in some cases, and attorney
                  fees in cases of willful misappropriation. In severe cases,
                  criminal penalties may apply under certain laws.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  When should I choose trade secret protection over a patent?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Choose trade secret protection when: (1) the innovation cannot
                  be easily reverse-engineered; (2) the information may remain
                  valuable beyond the 20-year patent term; (3) patentability is
                  uncertain; or (4) you wish to avoid the disclosure
                  requirements of patent applications. Patents are better when
                  public disclosure is inevitable or enforcement against
                  independent discovery is important.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Can I protect my trade secrets internationally?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Yes, many countries have enacted laws to protect trade
                  secrets, and international agreements like the TRIPS Agreement
                  require member countries to provide protection. However, the
                  specific requirements and enforcement mechanisms vary by
                  jurisdiction, so it's important to adapt your protection
                  strategies for each relevant country.
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
          <Link href="/guidelines/legal-requirements">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Legal Requirements
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Legal considerations and compliance information for IP
                  protection
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/patent">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Patent Guidelines
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Compare patent protection with trade secret protection
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
                  Overview of all intellectual property protection types
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
