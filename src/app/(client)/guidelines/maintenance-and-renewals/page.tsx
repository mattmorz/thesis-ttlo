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
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MaintenanceAndRenewalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Maintenance & Renewals
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about maintaining intellectual property rights,
          renewal requirements, and best practices for preserving your IP
          assets.
        </p>
      </div>

      <Separator className="my-6 bg-gray-200" />

      {/* Content Tabs */}
      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="w-full max-w-[600px] p-1 bg-gray-100 rounded-lg mx-auto flex justify-center">
          <TabsTrigger
            value="requirements"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Book className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <Clock className="h-4 w-4" />
            <span>Timeline</span>
          </TabsTrigger>
          <TabsTrigger
            value="procedures"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Procedures</span>
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-8 mt-6">
          <section>
            <h2 className="text-2xl font-medium mb-4 text-gray-800">
              MAINTAINING YOUR IP RIGHTS
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Maintaining intellectual property rights requires ongoing
              attention and timely action. Different types of IP have different
              maintenance requirements and renewal schedules that must be
              followed to keep the rights in force.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "Diligent maintenance of IP rights is as important as their
                    initial acquisition."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — IP MAINTENANCE OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Patent Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Maintenance fees due at 3.5, 7.5, and 11.5 years</li>
                  <li>Grace period available with surcharge</li>
                  <li>Monitor prior art developments</li>
                  <li>Document commercial success</li>
                  <li>Consider continuation applications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Trademark Renewals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>File declaration of use between 5th and 6th years</li>
                  <li>Renew registration every 10 years</li>
                  <li>Monitor marketplace for infringement</li>
                  <li>Maintain quality control over licensed use</li>
                  <li>Document continuous use in commerce</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Copyright Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Record transfers of ownership</li>
                  <li>Monitor for unauthorized use</li>
                  <li>Update registration for derivative works</li>
                  <li>Maintain evidence of creation date</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
            <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
            <AlertDescription className="text-gray-700">
              Failure to maintain IP rights can result in their permanent loss.
              Set up a reliable monitoring system to track important deadlines.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            MAINTENANCE TIMELINE BY IP TYPE
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Patent Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      3-3.5 years:
                    </span>
                    <span>
                      First maintenance fee due (with 6-month grace period)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      7-7.5 years:
                    </span>
                    <span>
                      Second maintenance fee due (with 6-month grace period)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      11-11.5 years:
                    </span>
                    <span>
                      Third maintenance fee due (with 6-month grace period)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      20 years:
                    </span>
                    <span>Patent term expires (from filing date)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Trademark Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      5-6 years:
                    </span>
                    <span>Declaration of use and/or excusable non-use due</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      9-10 years:
                    </span>
                    <span>
                      First renewal application due (with 6-month grace period)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      Every 10 years:
                    </span>
                    <span>Subsequent renewal applications due</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Copyright Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      Creation:
                    </span>
                    <span>Copyright protection begins automatically</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      0-5 years:
                    </span>
                    <span>
                      Ideal window for registration (if not registered at
                      creation)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2 min-w-[100px]">
                      Lifetime + 70:
                    </span>
                    <span>
                      Copyright protection lasts for author's life plus 70 years
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="procedures" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            MAINTENANCE PROCEDURES
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    Maintain accurate records of all IP assets, including
                    registration numbers, filing dates, and maintenance
                    deadlines
                  </li>
                  <li>
                    Set up a docketing system or calendar with reminders at
                    least 6 months before due dates
                  </li>
                  <li>
                    Budget for maintenance and renewal fees well in advance
                  </li>
                  <li>
                    Conduct regular portfolio reviews to assess the continued
                    value of each asset
                  </li>
                  <li>
                    Document use of trademarks and commercial applications of
                    patents
                  </li>
                  <li>Keep contact information with IP offices current</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Electronic Filing Systems
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  Most IP offices offer electronic systems for maintaining
                  registrations and patents:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>Create accounts on relevant IP office portals</li>
                  <li>
                    Link your registrations to your account for easier
                    management
                  </li>
                  <li>
                    Ensure your email address is up to date to receive official
                    notifications
                  </li>
                  <li>Save digital copies of all maintenance confirmations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Consequences of Non-Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>Loss of IP rights and protection</li>
                  <li>
                    Potential public domain status for your intellectual
                    property
                  </li>
                  <li>Expensive or impossible reinstatement procedures</li>
                  <li>Loss of priority dates and rights</li>
                  <li>Competitive disadvantage in the marketplace</li>
                  <li>
                    Devaluation of company assets in acquisitions and investment
                    scenarios
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
                  What happens if I miss a maintenance deadline?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Most IP systems offer grace periods, typically 6 months,
                  during which you can still pay maintenance fees with a late
                  surcharge. For patents, if you miss the grace period, your
                  patent will expire, but you may be able to petition for
                  reinstatement by showing the delay was unintentional or
                  unavoidable. For trademarks, missing renewal deadlines can
                  lead to cancellation, though some jurisdictions offer
                  reinstatement periods.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Can I pay maintenance fees in advance?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  For patents, most offices allow maintenance fees to be paid up
                  to 6 months before the due date. For trademarks, renewal
                  applications can typically be submitted up to 6-12 months
                  before the renewal deadline. Early payment can help avoid
                  inadvertent lapses but doesn't generally provide a discount or
                  extend the protection period.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Should I maintain all my IP assets or let some expire?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Strategic IP management often involves letting some assets
                  expire when they no longer provide sufficient business value.
                  Consider factors such as current and future market relevance,
                  technological advancement, enforcement costs, and licensing
                  potential. Conduct regular portfolio reviews to assess each
                  asset's continued value against maintenance costs. For core
                  business assets, maintaining protection is usually advisable.
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
                  Steps to properly file your initial IP applications
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
                  Legal considerations for maintaining IP protection
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
                  Detailed information about patent protection and maintenance
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
