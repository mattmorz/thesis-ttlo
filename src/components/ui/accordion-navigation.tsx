"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
  isDisabled: boolean;
  isCompleted?: boolean;
}

export function AccordionNavigation({ 
  sections,
  defaultValue 
}: { 
  sections: Section[];
  defaultValue?: string;
}) {
  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full"
      defaultValue={defaultValue}
    >
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger 
            disabled={section.isDisabled}
            className={section.isCompleted ? "text-primary" : ""}
          >
            {section.title}
          </AccordionTrigger>
          <AccordionContent>{section.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
} 