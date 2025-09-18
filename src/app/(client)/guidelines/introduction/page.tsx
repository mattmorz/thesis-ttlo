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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GuidelinesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Introduction to IP Protection
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          A comprehensive guide to understanding intellectual property and its
          protection mechanisms in the academic and research context.
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
            value="types"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>IP Types</span>
          </TabsTrigger>
          <TabsTrigger
            value="importance"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <InfoIcon className="h-4 w-4" />
            <span>Importance</span>
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
              WHAT IS INTELLECTUAL PROPERTY?
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Intellectual Property (IP) refers to creations of the mind, such
              as inventions, literary and artistic works, designs, symbols,
              names, and images used in commerce. IP is protected by laws that
              enable people to earn recognition or financial benefit from what
              they invent or create.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "Innovation distinguishes between a leader and a follower.
                    Protect your intellectual property - it's the foundation of
                    innovation."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — INTELLECTUAL PROPERTY OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <p className="text-gray-700 leading-relaxed text-base">
              The IP system helps strike a balance between the interests of
              innovators and the wider public interest. The incentive provided
              by IP rights encourages innovation, which in turn enhances the
              quality of human life. IP protection helps creators and inventors
              monetize their work while ensuring that knowledge is shared,
              allowing others to build upon it for future innovations.
            </p>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                Before submitting any IP application, we recommend reviewing all
                guideline sections to understand the full protection process.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="types" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            KEY TYPES OF IP PROTECTION
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-[#F9FFF9] border-b">
                <CardTitle className="text-xl text-[#1B5E20]">
                  Patents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-gray-700 text-base">
                  Patents protect new inventions and technological innovations
                  that are novel, non-obvious, and have industrial
                  applicability. Patents grant exclusive rights to the inventor
                  for a limited period, typically 20 years.
                </p>
                <div className="pt-2">
                  <Link href="/guidelines/patent">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-[#1B5E20] border-[#1B5E20] hover:bg-[#F9FFF9]"
                    >
                      Read Patent Guidelines{" "}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-[#F9FFF9] border-b">
                <CardTitle className="text-xl text-[#1B5E20]">
                  Copyrights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-gray-700 text-base">
                  Copyrights protect original literary, artistic, and creative
                  works, including books, music, art, software, and designs.
                  Copyright protection exists from the moment a work is created
                  in a fixed, tangible form.
                </p>
                <div className="pt-2">
                  <Link href="/guidelines/copyright">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-[#1B5E20] border-[#1B5E20] hover:bg-[#F9FFF9]"
                    >
                      Read Copyright Guidelines{" "}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-[#F9FFF9] border-b">
                <CardTitle className="text-xl text-[#1B5E20]">
                  Trademarks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-gray-700 text-base">
                  Trademarks protect brands, logos, and distinctive signs that
                  identify products or services. They help consumers distinguish
                  between products and can be maintained indefinitely as long as
                  they remain in use.
                </p>
                <div className="pt-2">
                  <Link href="/guidelines/trademark">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-[#1B5E20] border-[#1B5E20] hover:bg-[#F9FFF9]"
                    >
                      Read Trademark Guidelines{" "}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-[#F9FFF9] border-b">
                <CardTitle className="text-xl text-[#1B5E20]">
                  Trade Secrets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p className="text-gray-700 text-base">
                  Trade secrets protect confidential business information that
                  provides a competitive advantage. Unlike other IP types, trade
                  secrets are protected without registration, but require
                  measures to maintain secrecy.
                </p>
                <div className="pt-2">
                  <Link href="/guidelines/trade-secrets">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-[#1B5E20] border-[#1B5E20] hover:bg-[#F9FFF9]"
                    >
                      Read Trade Secrets Guidelines{" "}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="importance" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            WHY IP PROTECTION MATTERS
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium text-xl mb-3 text-[#1B5E20]">
                  Economic Value
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Intellectual property represents significant economic value in
                  today's knowledge-based economy. IP rights allow creators and
                  businesses to monetize their innovations and creative works,
                  generating revenue through licensing, sales, and partnerships.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium text-xl mb-3 text-[#1B5E20]">
                  Competitive Advantage
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Securing IP rights provides a competitive edge in the
                  marketplace by preventing others from using, selling, or
                  copying protected innovations without permission. This
                  exclusivity allows businesses to establish market position and
                  build brand recognition.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium text-xl mb-3 text-[#1B5E20]">
                  Innovation Incentive
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  The protection offered by IP rights encourages continued
                  investment in research and development. By ensuring creators
                  can benefit from their work, IP systems foster an environment
                  where innovation flourishes, benefiting society as a whole.
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
                  How long does IP protection last?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  The duration varies by IP type: Patents typically last 20
                  years, copyrights extend to the author's lifetime plus 70
                  years, trademarks can be renewed indefinitely as long as
                  they're in use, and trade secrets last as long as the
                  information remains confidential.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  What's the difference between a patent and a copyright?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Patents protect inventions and functional improvements, while
                  copyrights protect original creative expressions like writing,
                  art, music, and software. Patents require formal registration
                  and examination, while copyright protection is automatic upon
                  creation.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Can I protect my IP internationally?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Yes, through international treaties and filing systems like
                  the Patent Cooperation Treaty (PCT), the Madrid System for
                  trademarks, and the Berne Convention for copyrights. However,
                  protection requirements and enforcement vary by country.
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
                  Comprehensive information about protecting your novel
                  inventions
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/copyright">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Copyright Guidelines
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Learn how to protect your creative and literary works
                </p>
                <div className="mt-4 text-sm flex items-center text-[#1B5E20]">
                  View details <ExternalLink className="ml-2 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/guidelines/filing-procedures">
            <Card className="border cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="text-lg font-medium text-[#1B5E20] mb-2">
                  Filing Procedures
                </h3>
                <p className="text-sm text-gray-600 mb-auto">
                  Step-by-step instructions for submitting your IP applications
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
