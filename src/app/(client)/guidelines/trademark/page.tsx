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

export default function TrademarkGuidelinesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Trademark Guidelines
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about trademark protection, registration, and
          management for your brand identifiers and distinctive marks.
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
            value="requirements"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>Requirements</span>
          </TabsTrigger>
          <TabsTrigger
            value="registration"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <InfoIcon className="h-4 w-4" />
            <span>Registration</span>
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
              WHAT IS A TRADEMARK?
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              A trademark is a distinctive sign, symbol, word, or combination
              thereof that identifies and distinguishes the goods or services of
              one business from those of others. Trademarks serve as source
              identifiers in the marketplace, helping consumers recognize the
              origin of products and services.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "A trademark is a word, phrase, symbol, design, or a
                    combination of these things that identifies your goods or
                    services. It's how customers recognize you in the
                    marketplace."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — TRADEMARK OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              Types of Trademarks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Standard Character Mark
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Word marks consisting of text without styling or design
                    elements, protecting the text regardless of font or
                    appearance.
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Design Mark
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Logos, symbols, or stylized text with distinctive visual
                    elements that identify your brand.
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Service Mark
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Similar to a trademark but specifically identifies and
                    distinguishes the source of a service rather than goods.
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                  <CardTitle className="text-lg font-medium text-[#1B5E20]">
                    Collective Mark
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-gray-700">
                    Used by members of an association or group to indicate
                    membership or to identify goods/services with a particular
                    standard.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                Trademark rights can be established through use in commerce, but
                registration provides significant additional legal protections
                and nationwide rights.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            TRADEMARK REQUIREMENTS
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Distinctiveness
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The mark must be capable of distinguishing your goods or
                  services from those of others. Marks that are merely
                  descriptive of the goods/services generally cannot be
                  registered without acquiring distinctiveness through use.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Non-Generic
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Generic terms (common names for the goods/services) cannot be
                  registered as trademarks. For example, "Apple" for fruit would
                  be generic, but "Apple" for computers is not.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Non-Confusing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Your mark cannot be likely to cause confusion with an existing
                  trademark. This includes marks that are similar in appearance,
                  sound, meaning, or commercial impression to an existing mark
                  for related goods/services.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Use in Commerce
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  To maintain trademark rights, the mark must be actually used
                  in commerce. You can file an application based on intent to
                  use, but eventual use is required to complete registration.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registration" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            TRADEMARK REGISTRATION PROCESS
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 1: Clearance Search
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  Before filing, conduct a comprehensive search to ensure your
                  mark doesn't conflict with existing trademarks. This helps
                  avoid potential infringement issues and application
                  rejections.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 2: Prepare and File Application
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  File an application that includes the mark, goods/services
                  identification, filing basis (use in commerce or intent to
                  use), specimens showing use (if applicable), and required
                  fees.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 3: Examination
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  An examiner reviews the application to ensure compliance with
                  legal requirements and to check for conflicts with existing
                  marks. Office actions may be issued requiring responses to
                  address any issues.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Step 4: Publication and Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  If approved, the mark is published for opposition. If no
                  opposition is filed (or if opposition is unsuccessful), the
                  registration certificate is issued for use-based applications.
                  Intent-to-use applications require filing a Statement of Use
                  before registration.
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
                  How long does trademark protection last?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Trademark rights can last indefinitely as long as the mark
                  remains in use and all required maintenance documents are
                  filed. Registrations must be renewed every 10 years, with a
                  declaration of continued use required between the 5th and 6th
                  year after registration.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  What's the difference between ™ and ®?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  The ™ symbol can be used with any trademark, registered or
                  not, to indicate that you claim rights to the mark. The ®
                  symbol can only be used with marks that have been officially
                  registered with the Trademark Office. Using ® with an
                  unregistered mark is improper.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Do I need to register my trademark?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Registration is not mandatory, as rights can be established
                  through use. However, registration provides significant
                  benefits, including a legal presumption of ownership,
                  nationwide rights, the ability to record with Customs to
                  prevent importation of infringing goods, and enhanced remedies
                  in infringement cases.
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
                  Step-by-step guide to submitting your trademark application
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
                  Compare copyright and trademark protections for creative works
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
                  Requirements for maintaining your trademark registration
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
