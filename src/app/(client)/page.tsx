"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TypographyH1,
  TypographyH2,
  TypographyP,
} from "@/components/ui/typography";
import {
  ArrowRight,
  FileText,
  Search,
  BookOpen,
  Phone,
  Info,
  Lightbulb,
  Shield,
  Palette,
  Wrench,
  Globe,
  Lock,
  Calendar,
  Trophy,
  ChevronRight,
  ExternalLink,
  Star,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import HeaderImage from "@/assets/header.jpg";
import HeaderImage2 from "@/assets/header 2.jpg";
import HeaderImage3 from "@/assets/header 3.jpg";
import Footer from "@/components/blocks/footer";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CarouselHero } from "@/features/client/home/components/carousel-hero";
import {
  FAQSection,
  type FAQItem,
} from "@/components/ui/faq-section/faq-section";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Dynamic imports for platinum images
import Platinum1 from "@/assets/ttlo_pics/April 1/Platinum 1.jpg";
import Platinum2 from "@/assets/ttlo_pics/April 1/Platinum 2.jpg";
import Platinum3 from "@/assets/ttlo_pics/April 1/Platinum 3.jpg";
import Platinum4 from "@/assets/ttlo_pics/April 1/Platinum 4.jpg";
import Platinum5 from "@/assets/ttlo_pics/April 1/Platinum 5.jpg";
import Platinum6 from "@/assets/ttlo_pics/April 1/Platinum 6.jpg";

// Import awareness images
import Awareness1 from "@/assets/ttlo_pics/March 26/March 26 Awareness 1.jpg";
import Awareness2 from "@/assets/ttlo_pics/March 26/March 26 Awareness 2.jpg";
import Awareness3 from "@/assets/ttlo_pics/March 26/March 26 Awareness 3.jpg";

// Import class images
import Class1 from "@/assets/ttlo_pics/February 7/Feb 7 Class 1.jpg";
import Class2 from "@/assets/ttlo_pics/February 7/Feb 7 Class 2.jpg";
import Class3 from "@/assets/ttlo_pics/February 7/Feb 7 Class 3.jpg";

// Import RAISE Caraga images
import RaiseCaraga1 from "@/assets/ttlo_pics/Feb 4 Raise Caraga/Feb 4 Raise Caraga 1.jpg";
import RaiseCaraga12 from "@/assets/ttlo_pics/Feb 4 Raise Caraga/Feb 4 Raise Caraga 1.2 .jpg";
import RaiseCaraga21 from "@/assets/ttlo_pics/Feb 4 Raise Caraga/Feb 4 Raise Caraga 2.1.jpg";
import RaiseCaraga3 from "@/assets/ttlo_pics/Feb 4 Raise Caraga/Feb 4 Raise Caraga 3.jpg";
import RaiseCaraga4 from "@/assets/ttlo_pics/Feb 4 Raise Caraga/Feb 4 Raise Caraga 4.jpg";
import RaiseCaraga5 from "@/assets/ttlo_pics/Feb 4 Raise Caraga/Feb 4 Raise Caraga 5.jpg";

// Import Dialog components for modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// Group all news images
const platinumImages = [
  Platinum1,
  Platinum2,
  Platinum3,
  Platinum4,
  Platinum5,
  Platinum6,
];
const awarenessImages = [Awareness1, Awareness2, Awareness3];
const classImages = [Class1, Class2, Class3];
const raiseImages = [
  RaiseCaraga1,
  RaiseCaraga12,
  RaiseCaraga21,
  RaiseCaraga3,
  RaiseCaraga4,
  RaiseCaraga5,
];

const headerImages = [HeaderImage, HeaderImage2, HeaderImage3];

const ttloColors = {
  primary: "#1B5E20",
  secondary: "#4CAF50",
  accent: "#E8F5E9",
  neutral: "#F5F5F5",
};

const services = [
  {
    title: "Submit IP Application",
    description: "Start the process of protecting your intellectual property",
    tooltip: "Complete and submit forms to initiate the IP protection process",
    link: "/forms",
    icon: FileText,
    cta: "Start Application",
  },
  {
    title: "Track Your Applications",
    description: "Monitor and manage your ongoing IP submissions",
    tooltip: "View real-time status updates for all your IP applications",
    link: "/projects",
    icon: Search,
    cta: "Track Progress",
  },
  {
    title: "IP Guidelines",
    description: "Learn about the IP application process and requirements",
    tooltip:
      "Access comprehensive resources about intellectual property protection",
    link: "/guidelines/introduction",
    icon: BookOpen,
    cta: "Read More",
  },
  {
    title: "Contact",
    description: "Get assistance with your IP-related inquiries",
    tooltip: "Connect with our team for personalized support",
    link: "/contact",
    icon: Phone,
    cta: "Get Support",
  },
];

const ipTypesInfo = [
  {
    title: "Patents",
    description:
      "Protect new inventions, products, processes, and technological innovations that are novel, inventive, and industrially applicable.",
    icon: Lightbulb,
    color: "#4CAF50",
  },
  {
    title: "Copyrights",
    description:
      "Safeguard original creative works such as literary works, music, art, films, software, and other creative expressions.",
    icon: FileText,
    color: "#2196F3",
  },
  {
    title: "Trademarks",
    description:
      "Secure brand identities, logos, slogans, and other distinctive marks that identify and distinguish goods or services.",
    icon: Globe,
    color: "#9C27B0",
  },
  {
    title: "Trade Secrets",
    description:
      "Preserve confidential business information, formulae, practices, processes, designs, or compilations of information that provide competitive advantages.",
    icon: Lock,
    color: "#F44336",
  },
  {
    title: "Utility Models",
    description:
      "Protect incremental inventions with a shorter term and less stringent requirements than patents, also known as 'petty patents'.",
    icon: Wrench,
    color: "#FF9800",
  },
  {
    title: "Industrial Designs",
    description:
      "Protect the visual aesthetics, appearance, shape, configuration, pattern, or ornament of industrial products.",
    icon: Palette,
    color: "#673AB7",
  },
  {
    title: "Geographical Indications",
    description:
      "Protect products that have a specific geographical origin and possess qualities or reputation due to that origin.",
    icon: Info,
    color: "#009688",
  },
  {
    title: "Plant Variety Protection",
    description:
      "Protect new varieties of plants that are distinct, uniform, and stable to encourage the development of improved varieties.",
    icon: Shield,
    color: "#8BC34A",
  },
];

const faqData: FAQItem[] = [
  {
    question: "What is TTLO?",
    answer:
      "The Technology Transfer and Licensing Office (TTLO) is CSU's central hub for intellectual property management. We help the university community protect and commercialize their innovations, manage technology transfer processes, and foster industry partnerships.",
  },
  {
    question: "How do I apply for IP protection?",
    answer:
      "The process begins with submitting an IP disclosure form through our portal. Follow these steps: 1) Create an account, 2) Fill out the client profile, 3) Submit an IP disclosure form, 4) Provide supporting documentation, 5) Track your application progress through the dashboard.",
  },
  {
    question: "What types of IP does TTLO handle?",
    answer:
      "We manage various types of intellectual property including: Patents for new inventions, Copyrights for creative works, Trademarks for brands and logos, Trade secrets for confidential business information, and Utility Models for technical innovations.",
  },
  {
    question: "What are the costs associated with IP protection?",
    answer:
      "Costs vary depending on the type of IP and complexity of the application. TTLO covers many initial costs for eligible university innovations. For detailed fee information, please contact our office or visit the guidelines section.",
  },
  {
    question: "How long does the IP application process take?",
    answer:
      "Timelines vary by IP type. Copyright registrations typically take 3-6 months, while patents may take 1-3 years. Our team works diligently to expedite the process while ensuring thorough protection of your intellectual property.",
  },
];

// News data structure
const newsItems = [
  {
    id: 1,
    title: "CSU Earns IPOPHL's Top IP Award; All Caraga SUCs Now Platinum",
    date: "April 10, 2025",
    excerpt:
      "Caraga State University (CSU) proudly received the Platinum Award and Palladium Award from the Intellectual Property Office of the Philippines (IPOPHL) during the ITSO Presidents' Summit.",
    content: [
      "Caraga State University (CSU) proudly received the Platinum Award and Palladium Award from the Intellectual Property Office of the Philippines (IPOPHL) during the ITSO Presidents' Summit held at the Sequoia Hotel in Parañaque City earlier today, April 10, 2025. These honors are reflections of CSU's sustained commitment to innovation, intellectual property management, and technology transfer through its Technology Transfer and Licensing Office (TTLO).",
      "The Platinum Award, consistently earned by CSU for five consecutive years, recognizes exemplary performance in IP awareness, protection, and commercialization. This consequently led to a new Palladium Award, the highest accolade given to Innovation and Technology Support Offices (ITSOs), places the university among the distinguished group of national innovation leaders.",
      "Representing CSU at the event was Dr. Jeffrey T. Dellosa, Vice President for Research, Development, Innovation, and Extension, who shared key insights from the recently held ASEAN Technology and Innovation Support Center (TISC) Network Meeting in Cambodia, further enriching the summit discussions.",
      "CSU joins a distinguished group of Platinum Awardees this year, including Ateneo De Manila University, Central Mindanao State University, De La Salle University, Samar State University, and the University of the Philippines Manila.",
      "Together with Dr. Dellosa were Mr. Kenneth L. Ciudad, TTLO Director; Dr. Nathalie Daminar, RDIE Division Chief of CSUCC; and Ms. Charisse Galusan, ITSO Head of CSUCC. Their collective presence highlights CSU's strong and collaborative leadership in advancing the innovation ecosystem of Caraga.",
      "In a historic achievement for the region, all SUCs in Caraga—Agusan del Sur State College of Agriculture and Technology (ASSCAT), North Eastern Mindanao State University (NEMSU), Surigao del Norte State University (SNSU), and Caraga State University (CSU)—have now received Platinum Awards, marking a regional milestone in intellectual property and innovation excellence.",
      "Special congratulations to ASSCAT and NEMSU, whose IP successes were supported through CSU TTLO's mentorship under the RAISE IPTBM Program. This collective achievement underscores the growing strength of Caraga's innovation ecosystem, built through collaboration, capacity building, and shared vision.",
      "As CSU continues to scale greater heights in technology transfer and IP management, these awards reaffirm the university's role as a regional and national driver of innovation-driven development.",
    ],
    tags: [
      "CSUTTLO",
      "RAISECaraga",
      "IMPACTCSU",
      "IPOPHL",
      "ITSO",
      "InnovationExcellence",
      "IPLeadership",
      "CSUPlatinumAndPalladium",
      "CaragaInnovationEcosystem",
      "ITSOat100",
      "ITSOCluster2025",
    ],
    images: platinumImages,
    featured: true,
    category: "Award",
  },
  {
    id: 2,
    title: "Intellectual Property Awareness Seminar at CSUCC",
    date: "March 26, 2025",
    excerpt:
      "The Intellectual Property Awareness seminar was successfully held at Caraga State University Cabadbaran Campus, guiding attendees through the basics of IP protection.",
    content: [
      "On March 26, 2025, the Intellectual Property Awareness seminar was successfully held at Caraga State University Cabadbaran Campus.",
      "Attendees were guided through the basics of Intellectual Property by expert speakers—Ms. Alecris V. Gregorio, Ms. Charisse D. Galusan, Ms. Marisol Jane M. Beray, and Mr. Leonard John V. Carrillo.",
      "The seminar provided an overview of the IP system, including industrial property, patentable subject matter, and copyright-related rights, emphasizing the importance of protecting and fostering innovation in various fields.",
      "This event was organized by Caraga State University Cabadbaran Campus, through its Research and Development, Innovation, and Extension (RDIE) Office, led by Dr. Nathalie L. Daminar, in collaboration with the Technology Transfer and Licensing Office (TTLO) and the Innovation and Technology Support Office (ITSO), under the leadership of Ms. Charisse D. Galusan.",
      "This is a testament to our continued efforts to foster growth and creativity in the region, the nation, and beyond.",
    ],
    tags: [
      "IPAwareness",
      "CSUCabadbaran",
      "RDIE",
      "TTLO",
      "ITSO",
      "Seminar",
      "IntellectualProperty",
    ],
    images: awarenessImages,
    featured: false,
    category: "Event",
  },
  {
    id: 3,
    title: "Regional Echo of the Intellectual Property Master Class Concludes",
    date: "February 7, 2025",
    excerpt:
      "Three-day Regional Echo of the Intellectual Property Master Class brought together Technical Experts, Researchers and Innovators from established IPTBM offices.",
    content: [
      "The three-day Regional Echo of the Intellectual Property Master Class (IPMC) successfully concluded today, February 7, 2025.",
      "The Regional IPMC brought together Technical Experts, Researchers and Innovators from the three established Intellectual Property and Technology Business Management (IPTBM) offices - CSU, NEMSU and ASSCAT - under the RAISE Program in Caraga, led by our CSU TTLO director. Additionally, stakeholders from LGU, DA, and DepEd actively participated in the event.",
      "Held in Tandag City, this 3-day face-to-face training-workshop served as the continuation of the first part of the echo training on IP Management and Prior Art Searching which was conducted online last December 4-5, 2024. This time, talks on Patent Drafting, Preparing of Patent Documents, and Prosecution (Responding to Office Actions) were taught to the participants.",
      "This event was co-hosted by the 3 IPTBMs, and we extend our gratitude to IPTBM - NEMSU, led by Engr. Luzminda Bacquial, for taking the lead as the venue host.",
      "Congratulations to the team for their dedication and effort in organizing this event. Thank you everyone for your invaluable support!",
    ],
    tags: [
      "IPMC",
      "RegionalEcho",
      "PatentDrafting",
      "CSU",
      "NEMSU",
      "ASSCAT",
      "RAISE",
      "IPTBM",
    ],
    images: classImages,
    featured: false,
    category: "Training",
  },
  {
    id: 4,
    title: "RAISE Year 2 Strategic Action Plan Development Workshop",
    date: "January 30, 2025",
    excerpt:
      "The RAISE Program team successfully conducted the Year 2 Strategic Action Plan Development Workshop, setting clear goals and timelines for the upcoming quarter.",
    content: [
      "The RAISE Year 2 Strategic Action Plan Development Workshop was successfully conducted on January 30, 2025, at the CSU Hero Learning Commons Activity Center, Ampayon, Butuan City.",
      "This activity served as a vital platform for all Project Leaders and Staffs to align their activities and deliverables as the program enters the second quarter of year 2. Through a structured action planning session, lead by Program Leader, Mr. Kenneth L. Ciudad, the team developed clear goals, timelines, and responsibilities, ensuring that each project component contributes to the overarching vision of the RAISE Program.",
      "The workshop also provided an opportunity to reflect on past achievements, address challenges, and set a strategic direction for 2025.",
      "A RAISE Program team pictorial was also conducted after the Activity. With a well-defined Y2 roadmap in place, the RAISE Program is poised to achieve greater impact, ensuring that its initiatives remain focused, sustainable, and responsive to its goals.",
    ],
    tags: [
      "RAISE",
      "StrategicPlanning",
      "ActionPlan",
      "CSU",
      "Workshop",
      "Innovation",
    ],
    images: raiseImages,
    featured: false,
    category: "Workshop",
  },
];

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setNextImageIndex((currentImageIndex + 1) % headerImages.length);

      setTimeout(() => {
        setCurrentImageIndex(nextImageIndex);
        setIsTransitioning(false);
      }, 1500); // Smooth transition duration of 1.5 seconds
    }, 6000); // Total time between transitions - 6 seconds

    return () => clearInterval(interval);
  }, [currentImageIndex, nextImageIndex]);

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

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-white">
        <CarouselHero />

        <div className="container mx-auto">
          {/* Service Cards Section */}
          <div id="services" className="px-4 py-14">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-10"
            >
              <TypographyH2 className="text-2xl md:text-3xl font-bold text-[#1B5E20] mb-3">
                Intellectual Property Services
              </TypographyH2>
              <TypographyP className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
                Our comprehensive suite of services designed to help you
                navigate the intellectual property landscape.
              </TypographyP>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto"
            >
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Card className="group transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-md bg-white h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-[#E8F5E9] group-hover:bg-[#C8E6C9] transition-colors">
                          <service.icon className="h-5 w-5 text-[#1B5E20]" />
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CardTitle className="text-xl text-[#1B5E20]">
                              {service.title}
                            </CardTitle>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-[#1B5E20] text-white border-0"
                          >
                            {service.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <CardDescription className="text-gray-600">
                        {service.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between hover:bg-[#E8F5E9] text-[#1B5E20] hover:text-[#1B5E20] group-hover:bg-[#E8F5E9]"
                            asChild
                          >
                            <Link href={service.link}>
                              {service.cta}
                              <ArrowRight className="transition-transform group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-[#1B5E20] text-white border-0"
                        >
                          {service.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.section>
          </div>

          {/* IP Types Section with Carousel */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#F9FDF9] py-14 px-4 my-6"
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <TypographyH2 className="text-2xl md:text-3xl font-bold text-[#1B5E20] mb-3">
                  Types of Intellectual Property
                </TypographyH2>
                <TypographyP className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
                  Discover the different types of intellectual property
                  protection available through CSU TTLO.
                </TypographyP>
              </div>

              <Carousel
                className="w-full"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {ipTypesInfo.map((item, index) => (
                    <CarouselItem
                      key={index}
                      className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col"
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mb-4">
                              <div
                                className="p-3 rounded-full w-fit"
                                style={{ backgroundColor: `${item.color}20` }}
                              >
                                <item.icon
                                  className="h-6 w-6"
                                  style={{ color: item.color }}
                                />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-[#1B5E20] text-white border-0"
                          >
                            Learn more about {item.title}
                          </TooltipContent>
                        </Tooltip>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm flex-grow">
                          {item.description}
                        </p>
                        <div className="mt-4 pt-2 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            className="text-sm p-0 h-auto hover:bg-transparent hover:text-[#1B5E20] text-[#4CAF50] font-medium"
                            asChild
                          >
                            <Link
                              href="/guidelines/introduction"
                              className="flex items-center gap-1 group"
                            >
                              Learn more
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-6 gap-2">
                  <CarouselPrevious className="relative static bg-white border border-gray-200 hover:bg-gray-50 text-gray-700" />
                  <CarouselNext className="relative static bg-white border border-gray-200 hover:bg-gray-50 text-gray-700" />
                </div>
              </Carousel>
            </div>
          </motion.section>

          {/* Latest News & Achievements Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-14 px-4 my-6 bg-gradient-to-b from-white to-[#F9FDF9]"
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block mb-3">
                  <Badge className="bg-[#E8F5E9] text-[#1B5E20] px-3 py-1 text-sm rounded-full uppercase tracking-wide font-medium">
                    Latest Updates
                  </Badge>
                </div>
                <TypographyH2 className="text-2xl md:text-3xl font-bold text-[#1B5E20] mb-3">
                  News & Achievements
                </TypographyH2>
                <div className="w-20 h-1 bg-gradient-to-r from-[#4CAF50] to-[#81C784] mx-auto rounded-full mb-4"></div>
                <TypographyP className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
                  Stay updated with the latest accomplishments and activities
                  from our TTLO team.
                </TypographyP>
              </div>

              {/* Featured news item */}
              {newsItems
                .filter((item) => item.featured)
                .map((featuredItem) => (
                  <motion.div
                    key={featuredItem.id}
                    className="mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] items-stretch">
                            {/* Image Section with improved proportions */}
                            <div className="relative h-[400px] lg:h-full min-h-[400px] overflow-hidden bg-gray-50">
                              <Image
                                src={featuredItem.images[0]}
                                alt={featuredItem.title}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-700"
                                priority
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>

                            {/* Content Section with better spacing */}
                            <div className="p-8 lg:p-10 flex flex-col justify-between">
                              <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9] px-3 py-1 text-xs rounded-full">
                                    <Calendar className="w-3.5 h-3.5 mr-1" />{" "}
                                    {featuredItem.date}
                                  </Badge>
                                  <Badge className="bg-[#FFF8E1] text-[#FF8F00] hover:bg-[#FFECB3] px-3 py-1 text-xs rounded-full">
                                    <Trophy className="w-3.5 w-3.5 mr-1" />{" "}
                                    {featuredItem.category}
                                  </Badge>
                                  <Badge className="bg-[#E3F2FD] text-[#1976D2] hover:bg-[#BBDEFB] px-3 py-1 text-xs rounded-full">
                                    <Star className="w-3.5 w-3.5 mr-1" />{" "}
                                    Featured
                                  </Badge>
                                </div>

                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                                    {featuredItem.title}
                                  </h3>
                                  <div className="prose prose-sm max-w-none text-gray-600">
                                    {featuredItem.content
                                      .slice(0, 2)
                                      .map((paragraph, idx) => (
                                        <p key={idx} className="text-justify">
                                          {idx === 0
                                            ? paragraph
                                            : paragraph.substring(0, 150) +
                                              "..."}
                                        </p>
                                      ))}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-8">
                                <div className="flex flex-wrap gap-2 mb-6">
                                  {featuredItem.tags.slice(0, 5).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="bg-white text-[#4CAF50] border-[#C8E6C9] hover:bg-[#F1F8E9]"
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                  {featuredItem.tags.length > 5 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-white text-gray-500 border-gray-200"
                                    >
                                      +{featuredItem.tags.length - 5} more
                                    </Badge>
                                  )}
                                </div>

                                <Button
                                  variant="outline"
                                  className="w-full justify-center border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] font-medium"
                                >
                                  Read full article
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 text-xs">
                              {featuredItem.date}
                            </Badge>
                            <Badge className="bg-[#FFF8E1] text-[#FF8F00] px-2 py-0.5 text-xs">
                              {featuredItem.category}
                            </Badge>
                          </div>
                          <DialogTitle className="text-2xl font-bold">
                            {featuredItem.title}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="mt-4">
                          <Carousel className="w-full mb-6">
                            <CarouselContent>
                              {featuredItem.images.map((image, idx) => (
                                <CarouselItem key={idx}>
                                  <div className="relative h-[200px] sm:h-[400px] w-full overflow-hidden rounded-lg">
                                    <Image
                                      src={image}
                                      alt={`${featuredItem.title} - image ${
                                        idx + 1
                                      }`}
                                      fill
                                      className="object-contain"
                                      sizes="(max-width: 768px) 100vw, 80vw"
                                    />
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </Carousel>

                          <div className="space-y-4">
                            {featuredItem.content.map((paragraph, idx) => (
                              <p key={idx} className="text-gray-700">
                                {paragraph}
                              </p>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-6">
                            {featuredItem.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="bg-[#F1F8E9] text-[#43A047]"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}

              {/* Other news items in card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {newsItems
                  .filter((item) => !item.featured)
                  .map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Dialog>
                        <DialogTrigger asChild>
                          <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300 h-full flex flex-col bg-white border border-gray-100">
                            <div className="relative h-52 overflow-hidden bg-gray-50">
                              <Image
                                src={item.images[0]}
                                alt={item.title}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                              <div className="absolute top-3 right-3 z-10">
                                <Badge
                                  className={cn(
                                    "text-xs px-3 py-1 rounded-full font-medium",
                                    item.category === "Event"
                                      ? "bg-[#E3F2FD] text-[#1976D2]"
                                      : item.category === "Training"
                                      ? "bg-[#F3E5F5] text-[#7B1FA2]"
                                      : "bg-[#E0F2F1] text-[#00796B]"
                                  )}
                                >
                                  {item.category}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="flex-grow p-6">
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {item.date}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                {item.excerpt}
                              </p>
                            </CardContent>
                            <CardFooter className="px-6 pb-6 pt-0">
                              <Button
                                variant="outline"
                                className="w-full justify-center border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] font-medium"
                              >
                                Read full article
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </CardFooter>
                          </Card>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge
                                  className={cn(
                                    "px-3 py-1 rounded-full",
                                    item.category === "Event"
                                      ? "bg-[#E3F2FD] text-[#1976D2]"
                                      : item.category === "Training"
                                      ? "bg-[#F3E5F5] text-[#7B1FA2]"
                                      : "bg-[#E0F2F1] text-[#00796B]"
                                  )}
                                >
                                  {item.category}
                                </Badge>
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Calendar className="h-4 w-4 mr-1.5" />
                                  {item.date}
                                </div>
                              </div>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
                              {item.title}
                            </DialogTitle>
                            <Separator className="bg-gray-200" />
                          </DialogHeader>

                          <div className="mt-6 space-y-8">
                            <Carousel className="w-full">
                              <CarouselContent>
                                {item.images.map((image, idx) => (
                                  <CarouselItem key={idx}>
                                    <div className="relative h-[300px] sm:h-[400px] w-full overflow-hidden rounded-lg bg-gray-50">
                                      <Image
                                        src={image}
                                        alt={`${item.title} - image ${idx + 1}`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 80vw"
                                        priority={idx === 0}
                                      />
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious className="left-2" />
                              <CarouselNext className="right-2" />
                            </Carousel>

                            <div className="prose prose-gray max-w-none">
                              {item.content.map((paragraph, idx) => (
                                <p
                                  key={idx}
                                  className="text-gray-700 text-justify leading-relaxed"
                                >
                                  {paragraph}
                                </p>
                              ))}
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="bg-white text-[#1B5E20] border-[#C8E6C9] hover:bg-[#F1F8E9]"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </motion.div>
                  ))}
              </div>

              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  className="bg-white border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9]"
                  asChild
                >
                  <Link href="/forms?tab=client-profile">
                    View more news
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.section>

          {/* FAQ Section - Enhanced with new component */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="px-4 py-14"
          >
            <div className="max-w-6xl mx-auto">
              <FAQSection
                title="Frequently Asked Questions"
                description="Find answers to common questions about our intellectual property services and processes."
                faqs={faqData}
                enableSearch={false}
                iconBgColor="#E8F5E9"
                iconColor="#1B5E20"
                variant="two-column"
                overviewTitle="TTLO Services Overview"
                overviewDescription="The Technology Transfer and Licensing Office (TTLO) is Caraga State University's central hub for intellectual property management. We assist the university community in protecting innovations, managing IP portfolios, and facilitating technology transfer to bring university research to market."
              />
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </TooltipProvider>
  );
}
