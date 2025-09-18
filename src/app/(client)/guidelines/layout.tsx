"use client";

import { BreadcrumbNavigation } from "@/components/global/breadcrumb-navigation";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowUp, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

// Define guideline content type
interface GuidelineContent {
  title: string;
  href: string;
  keywords: string[];
  sections: string[];
  content: string[];
  matchingSections?: string[];
  matchingContent?: string[];
}

// Define the guideline content for searching
const guidelinesContent: GuidelineContent[] = [
  {
    title: "Introduction",
    href: "/guidelines/introduction",
    keywords: [
      "intellectual property",
      "overview",
      "IP",
      "protection",
      "importance",
      "types",
    ],
    sections: ["Overview", "IP Types", "Importance", "FAQs"],
    content: [
      "Intellectual property (IP) refers to creations of the mind, such as inventions, literary and artistic works, designs, symbols, names, and images used in commerce.",
      "IP rights allow creators or owners to benefit from their work or investment in a creation.",
      "IP protection helps encourage innovation and creativity by ensuring creators can earn recognition and financial benefit.",
      "The four main types of IP protection are patents, trademarks, copyrights, and trade secrets.",
      "Patents protect inventions and provide exclusive rights to make, use, and sell an invention for a limited period.",
      "Trademarks protect brands, logos, and other distinctive signs that identify and distinguish products or services.",
      "Copyrights protect original literary, dramatic, musical, and artistic works, including software, books, music, paintings, and films.",
      "Trade secrets protect confidential business information that provides a competitive advantage, such as formulas, practices, processes, designs, or compilations of information.",
      "Proper IP management is crucial for businesses to protect their valuable assets and maintain competitive advantage.",
      "International treaties help harmonize IP protection across different countries and jurisdictions.",
    ],
  },
  {
    title: "Patent Guidelines",
    href: "/guidelines/patent",
    keywords: [
      "patent",
      "invention",
      "novelty",
      "non-obvious",
      "utility",
      "application",
      "filing",
    ],
    sections: ["Basics", "Requirements", "Process", "Examples", "FAQs"],
    content: [
      "A patent is an exclusive right granted for an invention, providing the patent owner with the right to decide how others can use the invention.",
      "Patent protection means the invention cannot be commercially made, used, distributed, imported, or sold without the patent owner's consent.",
      "To qualify for patent protection, an invention must be novel, involve an inventive step, and have industrial applicability.",
      "Patent applications require detailed descriptions, claims, drawings, and disclosure of the best mode for carrying out the invention.",
      "The patent examination process involves substantive review, office actions, and potential amendments before the patent is granted.",
      "Patent protection typically lasts for 20 years from the filing date, subject to maintenance fee payments.",
      "Patents can be valuable business assets that can be sold, licensed, or used to secure funding.",
      "Different types of patents include utility patents, design patents, and plant patents.",
      "Patent infringement occurs when someone makes, uses, sells, or imports a patented invention without permission.",
      "Prior art searches help determine if an invention is novel and non-obvious compared to existing technology.",
    ],
  },
  {
    title: "Copyright Guidelines",
    href: "/guidelines/copyright",
    keywords: [
      "copyright",
      "artistic work",
      "literary work",
      "creative",
      "protection",
      "author rights",
      "exclusive rights",
    ],
    sections: ["Basics", "Requirements", "Registration", "FAQs"],
    content: [
      "Copyright is a legal right that grants the creator of an original work exclusive rights to determine how their work may be used and distributed.",
      "Copyright protection covers literary, artistic, musical, dramatic works, as well as computer software, architecture, and sound recordings.",
      "Copyright protection is automatic upon creation - as soon as a work is fixed in a tangible medium, it is protected by copyright.",
      "Copyright registration provides additional benefits such as public record of ownership and the ability to file an infringement lawsuit.",
      "The duration of copyright protection is typically the author's life plus 70 years in many countries.",
      "Copyright provides exclusive rights to reproduce, distribute, display, perform, and create derivative works.",
      "Fair use or fair dealing exceptions allow limited use of copyrighted material without permission for purposes such as criticism, education, and research.",
      "The Berne Convention is an international agreement governing copyright protection across multiple countries.",
      "Copyright notice © is not required but recommended to inform others that copyright is claimed.",
      "Work-for-hire agreements determine copyright ownership when works are created by employees or contractors.",
    ],
  },
  {
    title: "Trademark Guidelines",
    href: "/guidelines/trademark",
    keywords: [
      "trademark",
      "brand",
      "logo",
      "distinctive sign",
      "service mark",
      "business",
      "identification",
    ],
    sections: ["Basics", "Requirements", "Registration", "FAQs"],
    content: [
      "A trademark is a recognizable sign, design, or expression that identifies products or services from a particular source.",
      "Trademarks can include words, phrases, symbols, designs, colors, sounds, or a combination of these elements.",
      "To be registrable, a trademark must be distinctive and not confusingly similar to existing marks in the same field.",
      "Trademark protection helps prevent consumer confusion by identifying the source of goods and services.",
      "Registration provides nationwide protection, legal presumption of ownership, and exclusive right to use the mark.",
      "Trademark rights are established either through registration or actual use in commerce.",
      "Trademark protection can last indefinitely as long as the mark remains in use and registration renewals are filed.",
      "The ® symbol is used for registered trademarks, while ™ indicates unregistered trademarks.",
      "Trademark infringement occurs when an unauthorized party uses a mark that is identical or confusingly similar to a registered mark.",
      "International trademark protection can be obtained through the Madrid System or by filing in individual countries.",
    ],
  },
  {
    title: "Trade Secrets",
    href: "/guidelines/trade-secrets",
    keywords: [
      "trade secret",
      "confidential",
      "business information",
      "competitive advantage",
      "protection",
      "non-disclosure",
    ],
    sections: ["Basics", "Protection", "Management", "FAQs"],
    content: [
      "Trade secrets are confidential business information that provides a competitive advantage and is subject to reasonable measures to keep it secret.",
      "Unlike patents, trade secrets have no formal registration process and can potentially last indefinitely as long as they remain secret.",
      "Common types of trade secrets include formulas, processes, techniques, customer lists, and business strategies.",
      "To qualify as a trade secret, information must have independent economic value from not being generally known.",
      "Reasonable measures to protect trade secrets include confidentiality agreements, restricted access, and security protocols.",
      "Non-disclosure agreements (NDAs) are essential tools for protecting trade secrets when sharing information with others.",
      "Trade secret misappropriation occurs when secrets are acquired through improper means or breach of confidence.",
      "Legal remedies for trade secret theft include injunctions, damages, and in some cases, criminal penalties.",
      "Unlike patents, trade secrets don't protect against independent discovery or reverse engineering by others.",
      "Trade secret protection is governed by state laws in the U.S. (often based on the Uniform Trade Secrets Act) and various national laws globally.",
    ],
  },
  {
    title: "Filing Procedures",
    href: "/guidelines/filing-procedures",
    keywords: [
      "filing",
      "application",
      "procedure",
      "submission",
      "forms",
      "documentation",
      "process",
    ],
    sections: ["Overview", "Requirements", "Steps", "FAQs"],
    content: [
      "Filing procedures vary depending on the type of intellectual property protection being sought.",
      "Patent applications require specification, claims, drawings, abstract, and formal paperwork.",
      "Trademark applications need a clear representation of the mark and identification of goods/services.",
      "Copyright registration requires a completed application form, filing fee, and deposit copy of the work.",
      "Most IP offices provide electronic filing systems that streamline the application process.",
      "Prior to filing, conducting searches helps identify potential conflicts with existing IP rights.",
      "Priority filing dates can be established and claimed in multiple countries under international treaties.",
      "Application fees vary based on the type of protection, complexity, and number of classes or claims.",
      "After filing, examiners review applications for compliance with formal and substantive requirements.",
      "Office actions may be issued requesting clarification or modification of the application.",
      "Response deadlines to office actions are strict and missing them can result in abandoned applications.",
      "Applications that meet all requirements proceed to registration, grant, or issuance of the IP right.",
    ],
  },
  {
    title: "Maintenance & Renewal",
    href: "/guidelines/maintenance-and-renewals",
    keywords: [
      "maintenance",
      "renewal",
      "fee",
      "extension",
      "upkeep",
      "protection period",
      "expiration",
    ],
    sections: ["Requirements", "Timeline", "Procedures", "FAQs"],
    content: [
      "Maintaining IP rights requires ongoing attention to deadlines and compliance with renewal requirements.",
      "Patent maintenance fees are typically due at 3.5, 7.5, and 11.5 years from issuance in the U.S.",
      "Trademark registrations must be renewed every 10 years, with a declaration of use filed between the 5th and 6th years.",
      "Copyright registrations don't require renewals, but transfers of ownership should be recorded.",
      "Grace periods often exist for late payments, though additional surcharges will apply.",
      "Failing to pay maintenance fees or file renewals will result in the expiration of protection.",
      "Docketing systems or IP management software can help track important maintenance deadlines.",
      "International IP rights may have different renewal requirements in each jurisdiction.",
      "Some IP rights can be reinstated after expiration if specific conditions are met and petitions filed.",
      "Regular portfolio reviews help determine which IP assets should be maintained or allowed to expire.",
      "Maintenance fees increase as patents age, making strategic decisions about which patents to maintain important.",
      "Proper use and enforcement documentation should be maintained to strengthen IP rights.",
    ],
  },
  {
    title: "Legal Requirements",
    href: "/guidelines/legal-requirements",
    keywords: [
      "legal",
      "requirement",
      "compliance",
      "regulation",
      "law",
      "statutory",
      "obligations",
    ],
    sections: ["Overview", "Requirements", "Compliance", "FAQs"],
    content: [
      "Legal requirements for IP protection vary by country and type of intellectual property.",
      "Patents require novelty, non-obviousness (inventive step), and utility (industrial applicability).",
      "Trademarks must be distinctive and not confusingly similar to existing marks for similar goods/services.",
      "Copyright requires original work of authorship fixed in a tangible medium of expression.",
      "Trade secrets require reasonable measures to maintain secrecy and economic value from being secret.",
      "Documentation of invention development, creative process, or trademark use is important for establishing rights.",
      "Proper assignments and work-for-hire agreements ensure clear ownership of intellectual property.",
      "International protection requires compliance with various treaties and national laws.",
      "Enforcement of IP rights requires monitoring for infringement and taking timely legal action.",
      "Licenses and technology transfer agreements must comply with competition and antitrust laws.",
      "Tax implications related to IP ownership and transactions should be considered in IP strategy.",
      "Regulatory compliance may be required for certain IP types in regulated industries.",
    ],
  },
];

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
  { title: "Legal Requirements", href: "/guidelines/legal-requirements" },
];

export default function GuidelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const normalizedQuery = searchQuery.toLowerCase().trim();
    return guidelinesContent
      .map((guideline) => {
        // Check if search matches title or keywords
        const matchesTitle = guideline.title
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesKeywords = guideline.keywords.some((keyword) =>
          keyword.toLowerCase().includes(normalizedQuery)
        );

        // Include any sections that might match
        const matchingSections = guideline.sections.filter((section) =>
          section.toLowerCase().includes(normalizedQuery)
        );

        // Search through content paragraphs - NEW
        const matchingContent = guideline.content.filter((paragraph) =>
          paragraph.toLowerCase().includes(normalizedQuery)
        );

        // Return the result if there's any match
        if (
          matchesTitle ||
          matchesKeywords ||
          matchingSections.length > 0 ||
          matchingContent.length > 0
        ) {
          return {
            ...guideline,
            matchingSections,
            matchingContent: matchingContent.map((content) =>
              // Highlight the matching part in the content by showing a small snippet around it
              // with ellipsis if it's a long paragraph
              {
                const index = content.toLowerCase().indexOf(normalizedQuery);
                if (index === -1) return content;

                const startPos = Math.max(0, index - 40);
                const endPos = Math.min(
                  content.length,
                  index + normalizedQuery.length + 40
                );

                let snippet = content.substring(startPos, endPos);
                if (startPos > 0) snippet = "..." + snippet;
                if (endPos < content.length) snippet = snippet + "...";

                return snippet;
              }
            ),
          };
        }
        return null;
      })
      .filter(
        (
          result
        ): result is GuidelineContent & {
          matchingSections: string[];
          matchingContent: string[];
        } => result !== null
      );
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSearchResultClick = (href: string) => {
    router.push(href);
    clearSearch();
  };

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Clear search results when navigating to a new page
    setShowSearchResults(false);
  }, [pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {mounted && (
        <div className="container mx-auto px-4 pt-4 pb-2 border-b">
          <BreadcrumbNavigation />
        </div>
      )}

      <div className="flex gap-8 max-w-[1400px] mx-auto py-8 px-4">
        {/* Sidebar Navigation */}
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              IP Guidelines
            </h2>
            <div className="relative mb-6">
              <form onSubmit={handleSearch}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search guidelines..."
                  className="pl-10 h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length > 2) {
                      setShowSearchResults(true);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md border border-gray-200 shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                      {searchResults.length} result
                      {searchResults.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {searchResults.map((result) => (
                      <li
                        key={result.href}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <button
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                          onClick={() => handleSearchResultClick(result.href)}
                        >
                          <div className="font-medium text-[#1B5E20]">
                            {result.title}
                          </div>
                          {result.matchingSections.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Sections:</span>{" "}
                              {result.matchingSections.join(", ")}
                            </div>
                          )}
                          {result.matchingContent.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1 border-t pt-1 border-gray-100">
                              <span className="font-medium block mb-1">
                                Matching content:
                              </span>
                              {result.matchingContent
                                .slice(0, 2)
                                .map((content, i) => (
                                  <p
                                    key={i}
                                    className="mb-1 text-xs line-clamp-2"
                                  >
                                    {content}
                                  </p>
                                ))}
                              {result.matchingContent.length > 2 && (
                                <p className="text-[10px] text-gray-500 italic">
                                  and {result.matchingContent.length - 2} more
                                  matches...
                                </p>
                              )}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showSearchResults &&
                searchQuery.length > 2 &&
                searchResults.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-md border border-gray-200 shadow-lg p-4 text-center">
                    <p className="text-gray-500">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
            </div>
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <nav className="divide-y divide-gray-100">
                {guidelineSections.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={cn(
                      "px-4 py-3 text-sm transition-colors flex items-center justify-between",
                      pathname === section.href
                        ? "bg-[#E8F5E9] text-[#1B5E20] font-medium border-l-4 border-[#1B5E20]"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    )}
                  >
                    {section.title}
                    <ChevronRight
                      className={cn(
                        "h-4 w-4",
                        pathname === section.href
                          ? "text-[#1B5E20]"
                          : "text-gray-400"
                      )}
                    />
                  </Link>
                ))}
              </nav>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          {children}

          {/* Back to Top Button */}
          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 p-3 bg-[#1B5E20] text-white rounded-full shadow-lg hover:bg-[#2E7D32] transition-colors duration-200 z-10"
              aria-label="Back to top"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
