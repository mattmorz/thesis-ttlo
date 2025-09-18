"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  Search,
  ChevronDown,
  MessageSquare,
  BookOpen,
  Phone,
} from "lucide-react";
import {
  TypographyH2,
  TypographyH3,
  TypographyP,
} from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  faqs: FAQItem[];
  enableSearch?: boolean;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  variant?: "default" | "two-column";
  overviewTitle?: string;
  overviewDescription?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function FAQSection({
  title = "Frequently Asked Questions",
  description,
  faqs,
  enableSearch = false,
  icon,
  iconBgColor = "#F3F4F6",
  iconColor = "#6B7280",
  variant = "default",
  overviewTitle = "TTLO Overview",
  overviewDescription = "Managing a small business today is already tough. Avoid further complications by ditching outdated, tedious trade methods. Our goal is to streamline SMB trade, making it easier and faster than ever.",
  ctaText,
  ctaUrl,
}: FAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const filteredFAQs = faqs.filter((faq) =>
    searchQuery
      ? faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setExpanded(filteredFAQs.map((_, i) => `item-${i}`));
    } else {
      setExpanded([]);
    }
  };

  const handleAccordionChange = (value: string) => {
    setExpanded((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  if (variant === "two-column") {
    return (
      <div className="w-full">
        {/* FAQ Header - Using circular icon with text next to it */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-full"
              style={{ backgroundColor: iconBgColor || "#E8F5E9" }}
            >
              {icon || (
                <HelpCircle
                  className="h-5 w-5"
                  style={{ color: iconColor || "#1B5E20" }}
                />
              )}
            </div>
            <TypographyH2 className="text-2xl font-bold">{title}</TypographyH2>
          </div>
          {description && (
            <TypographyP className="text-gray-600 max-w-2xl mx-auto mb-6">
              {description}
            </TypographyP>
          )}
        </div>

        {/* Cards Container - Aligned with the cards above */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel - Overview Card */}
          <div ref={leftPanelRef} className="w-full h-full">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full">
              <div className="flex flex-col h-full p-6">
                {/* FAQs Badge */}
                <div className="mb-4">
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100">
                    FAQ
                  </span>
                </div>

                {/* Title */}
                <TypographyH3 className="text-xl font-bold text-gray-900 mb-4">
                  {overviewTitle}
                </TypographyH3>

                {/* Description */}
                <TypographyP className="text-gray-600 mb-6 flex-grow leading-relaxed">
                  {overviewDescription}
                </TypographyP>

                {/* CTA Button */}
                {ctaText && ctaUrl && (
                  <div className="mt-auto pt-2">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-lg w-full justify-center py-2.5 text-sm"
                      asChild
                    >
                      <a href={ctaUrl}>
                        <MessageSquare className="h-4 w-4" />
                        <span>{ctaText}</span>
                        <span className="ml-1">👋</span>
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - FAQ Accordion */}
          <div ref={rightPanelRef} className="w-full">
            {enableSearch && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9 h-10 border-gray-200"
                />
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full">
              {filteredFAQs.length === 0 ? (
                <div className="flex items-center justify-center h-full py-8">
                  <TypographyP className="text-gray-500">
                    No FAQs found matching your search.
                  </TypographyP>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {filteredFAQs.map((faq, index) => (
                    <div
                      key={`faq-${index}`}
                      className={cn("border-b border-gray-200 last:border-b-0")}
                    >
                      <button
                        onClick={() => handleAccordionChange(`item-${index}`)}
                        className="flex items-center justify-between w-full px-6 py-4 text-left"
                      >
                        <h3 className="font-medium text-gray-900">
                          {faq.question}
                        </h3>
                        <div
                          className={cn(
                            "transform transition-transform duration-200",
                            expanded.includes(`item-${index}`)
                              ? "rotate-180"
                              : ""
                          )}
                        >
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>

                      {expanded.includes(`item-${index}`) && (
                        <div className="px-6 pb-5">
                          <div className="text-gray-600">{faq.answer}</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add invisible spacer divs to maintain minimum height */}
                  {filteredFAQs.length < 3 && <div className="flex-grow" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default single-column layout
  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-full"
            style={{ backgroundColor: iconBgColor || "#E8F5E9" }}
          >
            {icon || (
              <HelpCircle
                className="h-5 w-5"
                style={{ color: iconColor || "#1B5E20" }}
              />
            )}
          </div>
          <TypographyH2 className="text-2xl font-bold">{title}</TypographyH2>
        </div>
        {description && (
          <TypographyP className="text-gray-600 max-w-2xl mx-auto">
            {description}
          </TypographyP>
        )}
      </div>

      {enableSearch && (
        <div className="relative mb-6 max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 h-10 border-gray-200"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-6 border border-gray-200 rounded-lg">
            <TypographyP className="text-gray-500">
              No FAQs found matching your search.
            </TypographyP>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {filteredFAQs.map((faq, index) => (
              <div
                key={`faq-${index}`}
                className={cn("border-b border-gray-200 last:border-b-0")}
              >
                <button
                  onClick={() => handleAccordionChange(`item-${index}`)}
                  className="flex items-center justify-between w-full px-6 py-4 text-left"
                >
                  <h3 className="font-medium text-gray-900">{faq.question}</h3>
                  <div
                    className={cn(
                      "transform transition-transform duration-200",
                      expanded.includes(`item-${index}`) ? "rotate-180" : ""
                    )}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </button>

                {expanded.includes(`item-${index}`) && (
                  <div className="px-6 pb-5">
                    <div className="text-gray-600">{faq.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// For reference, this component can be used with other feature cards like:
// <FeatureCard
//   icon={<BookOpen className="h-5 w-5" />}
//   title="IP Guidelines"
//   description="Learn about the IP application process and requirements"
//   ctaText="Read More"
//   ctaUrl="/guidelines"
//   iconBgColor="#E8F5E9"
//   iconColor="#1B5E20"
// />
// <FeatureCard
//   icon={<Phone className="h-5 w-5" />}
//   title="Contact"
//   description="Get assistance with your IP-related inquiries"
//   ctaText="Get Support"
//   ctaUrl="/contact"
//   iconBgColor="#E8F5E9"
//   iconColor="#1B5E20"
// />
