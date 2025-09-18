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
import { usePathname } from "next/navigation";
import { ChevronRight, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const guidelineSections = [
  { title: "Introduction", href: "/guidelines/introduction" },
  { title: "Patent Guidelines", href: "/guidelines/patent" },
  { title: "Copyright Guidelines", href: "/guidelines/copyright" },
  { title: "Trademark Guidelines", href: "/guidelines/trademark" },
  { title: "Trade Secrets", href: "/guidelines/trade-secrets" },
  { title: "Filing Procedures", href: "/guidelines/filing-procedures" },
  {
    title: "Maintenance & Renewal",
    href: "/guidelines/maintenance-and-renewals",
  },
  { title: "Legal Requirements", href: "/guidelines/legal" },
];

export default function CopyrightGuidelinesPage() {
  const pathname = usePathname();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Copyright Guidelines
        </h1>
        <p className="text-gray-600 mt-2 text-lg leading-relaxed">
          Essential information about copyright protection, creator rights, and
          procedures for securing your creative works.
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
            <FileText className="h-4 w-4" />
            <span>Protection</span>
          </TabsTrigger>
          <TabsTrigger
            value="rights"
            className="flex items-center gap-2 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] rounded-md"
          >
            <InfoIcon className="h-4 w-4" />
            <span>Rights</span>
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
              WHAT IS COPYRIGHT?
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Copyright is a form of intellectual property protection that gives
              creators exclusive rights to their original works of authorship,
              including literary, dramatic, musical, artistic, and certain other
              creative works.
            </p>
          </section>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="border-l-4 border-[#1B5E20]">
              <CardContent className="p-6 bg-[#F9FFF9]">
                <blockquote className="pl-6 py-2 italic">
                  <p className="text-xl text-gray-800 mb-2 leading-relaxed">
                    "Copyright protection exists from the moment a work is
                    created in a fixed, tangible form of expression."
                  </p>
                  <cite className="text-sm text-gray-600 block mt-4 font-semibold">
                    — COPYRIGHT OFFICE
                  </cite>
                </blockquote>
              </CardContent>
            </div>
          </Card>

          <section>
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              Key Principles of Copyright
            </h3>
            <p className="text-gray-700 leading-relaxed text-base mb-6">
              Copyright is automatic upon creation. Once a work is fixed in a
              tangible medium, copyright protection begins automatically without
              the need for registration or notice. However, registration
              provides important legal benefits and is generally necessary if
              you wish to bring a lawsuit for infringement.
            </p>

            <Alert className="mt-8 border-l-4 border-[#1B5E20] bg-[#F9FFF9] shadow-sm">
              <InfoIcon className="h-5 w-5 text-[#1B5E20]" />
              <AlertDescription className="text-gray-700">
                While copyright is automatic, registration with the Copyright
                Office provides additional legal protections and the ability to
                claim statutory damages in infringement cases.
              </AlertDescription>
            </Alert>
          </section>
        </TabsContent>

        <TabsContent value="protection" className="space-y-6 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            WHAT COPYRIGHT PROTECTS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Literary Works
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700">
                  Books, articles, manuscripts, poems, computer programs, and
                  other textual works, regardless of whether they are published
                  or unpublished.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Visual Arts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700">
                  Paintings, photographs, sculptures, graphic designs,
                  illustrations, and other visual works of art that express
                  creative authorship.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Performing Arts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700">
                  Musical compositions, dramatic works like plays, choreography,
                  and other works intended to be performed for an audience.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Audio & Visual Media
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700">
                  Motion pictures, videos, sound recordings, and other
                  audiovisual content that contains original expression.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h3 className="font-medium text-xl mb-4 text-[#1B5E20]">
              What Copyright Does Not Protect
            </h3>
            <Card className="border bg-white shadow-sm">
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    Ideas, procedures, methods, systems, processes, concepts,
                    principles, or discoveries
                  </li>
                  <li>
                    Works consisting entirely of common information with no
                    original authorship
                  </li>
                  <li>Titles, names, short phrases, and slogans</li>
                  <li>Familiar symbols or designs</li>
                  <li>
                    Mere variations of typographic ornamentation, lettering, or
                    coloring
                  </li>
                  <li>Listings of ingredients or contents</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rights" className="space-y-8 mt-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            RIGHTS GRANTED BY COPYRIGHT
          </h2>

          <div className="space-y-6">
            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Reproduction Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The exclusive right to make copies of the work in any format.
                  This includes digital reproduction, physical copying, and any
                  other form of duplication.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Distribution Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The exclusive right to distribute copies of the work to the
                  public by sale, rental, lease, lending, or other transfer of
                  ownership.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Derivative Work Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The exclusive right to create adaptations or transformations
                  of the original work, such as translations, dramatizations, or
                  adaptations to other mediums.
                </p>
              </CardContent>
            </Card>

            <Card className="border bg-white shadow-sm">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-lg font-medium text-[#1B5E20]">
                  Public Performance & Display Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  The exclusive right to perform or display the work publicly,
                  including broadcasting, online streaming, or presentation in a
                  public venue.
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
                  How long does copyright protection last?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  For works created after January 1, 1978, copyright protection
                  lasts for the author's lifetime plus 70 years. For works made
                  for hire, anonymous works, or pseudonymous works, protection
                  lasts 95 years from publication or 120 years from creation,
                  whichever is shorter.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  Do I need to register my copyright?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  No, registration is not required for copyright protection.
                  However, registration offers important legal advantages,
                  including the ability to file an infringement lawsuit,
                  establish a public record of ownership, and qualify for
                  statutory damages and attorney's fees in successful
                  litigation.
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 bg-[#F9FFF9] border-b">
                <CardTitle className="text-base font-medium text-gray-800">
                  What is fair use?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">
                  Fair use is a legal doctrine that permits limited use of
                  copyrighted material without permission for purposes such as
                  criticism, comment, news reporting, teaching, scholarship, or
                  research. Factors considered include the purpose of use,
                  nature of the work, amount used, and effect on the potential
                  market.
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
                  Steps to register your copyright with official authorities
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
                  Learn when you need trademark instead of copyright protection
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
                  Legal considerations and obligations for copyright holders
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

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-[#1B5E20] text-white rounded-full shadow-lg hover:bg-[#2E7D32] transition-colors duration-200"
          aria-label="Back to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
