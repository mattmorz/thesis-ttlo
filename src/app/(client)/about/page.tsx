"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyList,
  TypographyLead,
} from "@/components/ui/typography";
import Image from "next/image";
import HeaderImage2 from "@/assets/header 2.jpg";
import Footer from "@/components/blocks/footer";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building,
  Users,
  Award,
  Lightbulb,
  ChevronRight,
  BookOpen,
  GraduationCap,
  FileText,
  Briefcase,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  useEffect(() => {
    const header = document.querySelector("header");
    if (header) {
      header.style.position = "fixed";
      header.style.top = "0";
      header.style.width = "100%";
      // Add padding to body to prevent content jump
      document.body.style.paddingTop = `${header.offsetHeight}px`;
    }

    return () => {
      // Cleanup when component unmounts
      const header = document.querySelector("header");
      if (header) {
        header.style.position = "absolute";
        document.body.style.paddingTop = "0";
      }
    };
  }, []);

  const aboutCards = [
    {
      title: "Our Team",
      description:
        "Meet the dedicated professionals working tirelessly to protect and commercialize CSU's intellectual property.",
      icon: Users,
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
    {
      title: "Our Values",
      description:
        "Innovation, integrity, excellence, and collaboration drive everything we do at TTLO.",
      icon: Shield,
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
    {
      title: "Our Approach",
      description:
        "We take a collaborative, hands-on approach to managing intellectual property and fostering innovation.",
      icon: Lightbulb,
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
  ];

  const serviceItems = [
    {
      title: "Intellectual Property Protection",
      description:
        "Comprehensive guidance on securing patents, trademarks, copyrights, and trade secrets",
      icon: Shield,
    },
    {
      title: "Technology Commercialization",
      description:
        "Strategic marketing and licensing of university innovations to industry partners",
      icon: Briefcase,
    },
    {
      title: "Research Collaboration",
      description:
        "Facilitating partnerships between CSU researchers and external organizations",
      icon: GraduationCap,
    },
    {
      title: "IP Documentation",
      description:
        "Professional preparation and filing of all necessary intellectual property documentation",
      icon: FileText,
    },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* Hero Section with Refined Formal Design */}
        <div className="relative h-[350px] w-full overflow-hidden mb-16">
          {/* Clean professional gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2A0D] to-[#1B5E20]"></div>

          {/* Structured grid pattern with proper opacity */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' stroke='%23ffffff' stroke-opacity='0.3' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "40px 40px",
            }}
          ></div>

          {/* Single decorative border element */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20"></div>

          {/* Clean fade to white transition */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>

          <div className="container mx-auto h-full flex items-center justify-center relative z-10">
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-[2px] bg-white/30"></div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center px-4 pt-4"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm shadow-sm">
                  <Building className="h-7 w-7 text-white" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                About TTLO
              </h1>

              <div className="text-white/80 text-sm font-medium tracking-wider uppercase mb-6">
                Technology Transfer and Licensing Office
              </div>

              <p className="text-white/90 max-w-2xl mx-auto text-lg">
                The central hub for intellectual property management and
                commercialization at Caraga State University.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 space-y-20">
          {/* Vision & Mission Section - Enhanced */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border border-gray-100 shadow-md overflow-hidden h-full">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-full bg-[#E8F5E9]">
                      <BookOpen className="h-5 w-5 text-[#1B5E20]" />
                    </div>
                    <TypographyH2 className="text-2xl font-semibold text-[#1B5E20] m-0 p-0">
                      Our Vision
                    </TypographyH2>
                  </div>
                  <Separator className="bg-[#E8F5E9]" />
                  <TypographyP className="text-gray-700 leading-relaxed">
                    To be the premier intellectual property hub in the Caraga
                    region, driving innovation, fostering academic-industry
                    collaborations, and transforming research discoveries into
                    impactful solutions for societal challenges.
                  </TypographyP>
                </CardContent>
              </Card>

              <Card className="border border-gray-100 shadow-md overflow-hidden h-full">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-full bg-[#E8F5E9]">
                      <Building className="h-5 w-5 text-[#1B5E20]" />
                    </div>
                    <TypographyH2 className="text-2xl font-semibold text-[#1B5E20] m-0 p-0">
                      Our Mission
                    </TypographyH2>
                  </div>
                  <Separator className="bg-[#E8F5E9]" />
                  <TypographyP className="text-gray-700 leading-relaxed">
                    The Technology Transfer and Licensing Office (TTLO) serves
                    as the bridge between academic innovation and real-world
                    impact. We help protect and commercialize intellectual
                    property, facilitate technology transfer, and foster
                    collaboration between CSU researchers and industry partners.
                  </TypographyP>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Image and What We Do section - Redesigned for better visual balance */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto"
          >
            <div className="order-2 md:order-1">
              <div className="sticky top-24">
                <TypographyH2 className="text-3xl font-semibold text-[#1B5E20] mb-6">
                  What We Do
                </TypographyH2>
                <TypographyLead className="text-gray-700 mb-6">
                  Our office provides comprehensive support for intellectual
                  property management and commercialization.
                </TypographyLead>

                <div className="space-y-6 mt-8">
                  {serviceItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-[#1B5E20]" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    variant="outline"
                    className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] hover:text-[#1B5E20] gap-2"
                    asChild
                  >
                    <Link href="/contact">
                      Contact Us
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-1 md:order-2"
            >
              <div className="relative h-[500px] rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={HeaderImage2}
                  alt="TTLO Office"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="bg-white/90 text-[#1B5E20] text-sm font-medium py-1 px-3 rounded-full">
                    Caraga State University
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* About Cards - Improved visual design */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto bg-gray-50 py-16 px-4 sm:px-8 rounded-2xl"
          >
            <div className="text-center mb-12">
              <span className="inline-block bg-[#E8F5E9] text-[#1B5E20] text-sm font-medium py-1 px-3 rounded-full mb-3">
                About Us
              </span>
              <TypographyH2 className="text-3xl font-semibold text-gray-900">
                Learn More About TTLO
              </TypographyH2>
              <div className="w-24 h-1 bg-[#1B5E20] mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-white overflow-hidden">
                    <div className="h-2 bg-[#1B5E20]"></div>
                    <CardHeader className="pt-6 pb-2">
                      <div className="flex items-center gap-4">
                        <div
                          className="p-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        >
                          <card.icon
                            className="h-6 w-6"
                            style={{ color: card.iconColor }}
                          />
                        </div>
                        <CardTitle className="text-xl text-gray-900">
                          {card.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TypographyP className="text-gray-600">
                        {card.description}
                      </TypographyP>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </>
  );
}
