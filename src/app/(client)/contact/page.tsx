"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  HelpCircle,
  Building,
  Send,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
} from "@/components/ui/typography";
import Footer from "@/components/blocks/footer";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FAQSection,
  type FAQItem,
} from "@/components/ui/faq-section/faq-section";

export default function ContactPage() {
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

  const contactDetails = [
    {
      icon: Phone,
      title: "Phone",
      info: "+63 (85) 123-4567",
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
    {
      icon: Mail,
      title: "Email",
      info: "ttlo@carsu.edu.ph",
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
    {
      icon: MapPin,
      title: "Office Location",
      info: "Technology Transfer and Licensing Office, Caraga State University, Ampayon, Butuan City, 8600",
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
    {
      icon: Clock,
      title: "Office Hours",
      info: "Monday to Friday: 8:00 AM - 5:00 PM",
      color: "#E8F5E9",
      iconColor: "#1B5E20",
    },
  ];

  const quickLinks = [
    { title: "Schedule Consultation", icon: Calendar, href: "#schedule" },
    { title: "Submit IP Application", icon: Send, href: "/forms" },
    { title: "Visit Our Office", icon: MapPin, href: "#location" },
    { title: "Technical Support", icon: AlertCircle, href: "#support" },
  ];

  const faqData: FAQItem[] = [
    {
      question: "How can I get help with my IP application?",
      answer:
        "Our office provides comprehensive support throughout the IP application process. You can reach out to us via phone, email, or by visiting our office during business hours. Our team of experts will guide you through the process and answer any questions you may have.",
    },
    {
      question: "What information should I prepare before contacting TTLO?",
      answer:
        "To help us assist you more efficiently, please prepare basic information about your innovation or creative work, your affiliation with the university, and the specific stage you're at in the IP process. Having documentation about your invention or work will also be helpful during our initial consultation.",
    },
    {
      question: "How long does it typically take to get a response?",
      answer:
        "We strive to respond to all inquiries within 24-48 business hours. For complex matters, we may schedule a follow-up meeting or call to discuss your needs in more detail. During peak periods, response times may be slightly longer, but we'll acknowledge receipt of your message promptly.",
    },
    {
      question: "Can I schedule an appointment with a TTLO representative?",
      answer:
        "Yes, you can schedule a consultation with one of our IP specialists. Please call our office or send an email with your preferred date and time, and we'll do our best to accommodate your request. Virtual meetings are also available for those who cannot visit in person.",
    },
    {
      question: "Is there a walk-in consultation option available?",
      answer:
        "We welcome walk-in consultations during regular office hours, though we recommend scheduling an appointment to ensure a specialist is available to assist you. For complex IP matters, a scheduled appointment allows us to prepare and provide more comprehensive guidance.",
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
                  <Mail className="h-7 w-7 text-white" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                Contact Us
              </h1>

              <div className="text-white/80 text-sm font-medium tracking-wider uppercase mb-6">
                Technology Transfer and Licensing Office
              </div>

              <p className="text-white/90 max-w-2xl mx-auto text-lg">
                Have questions about intellectual property protection or our
                services? Our team is here to assist you.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Floating Quick Links Card - adjust position to account for new hero design */}
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: -30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <Card className="border border-gray-100 shadow-lg relative z-10 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {quickLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-[#E8F5E9] transition-colors text-center group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
                        <link.icon className="h-5 w-5 text-[#1B5E20]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {link.title}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 space-y-20 py-16">
          {/* Contact Information and Form */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto"
            id="contact-form"
          >
            <div className="lg:col-span-2 space-y-8">
              <div>
                <span className="inline-block bg-[#E8F5E9] text-[#1B5E20] text-sm font-medium py-1 px-3 rounded-full mb-3">
                  Get In Touch
                </span>
                <TypographyH2 className="text-3xl font-semibold text-gray-900 mb-3">
                  Let's Talk
                </TypographyH2>
                <TypographyLead className="text-gray-600">
                  We're here to assist you with any questions about intellectual
                  property protection or our services.
                </TypographyLead>
              </div>

              <Card className="border border-gray-100 shadow-md overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    {contactDetails.map((item, index) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="p-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        >
                          <item.icon
                            className="h-5 w-5"
                            style={{ color: item.iconColor }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.info}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <Card className="border border-gray-100 shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50 border-b p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-[#E8F5E9]">
                      <Mail className="h-5 w-5 text-[#1B5E20]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        Send a Message
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Fill out the form below and we'll get back to you within
                        24-48 hours.
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="text-sm font-medium text-gray-700"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="name"
                          placeholder="Your full name"
                          className="border-gray-300 focus:border-[#1B5E20] focus:ring focus:ring-[#E8F5E9] focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="border-gray-300 focus:border-[#1B5E20] focus:ring focus:ring-[#E8F5E9] focus:ring-opacity-50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="phone"
                          className="text-sm font-medium text-gray-700"
                        >
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          placeholder="+63 xxx xxx xxxx"
                          className="border-gray-300 focus:border-[#1B5E20] focus:ring focus:ring-[#E8F5E9] focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="subject"
                          className="text-sm font-medium text-gray-700"
                        >
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="subject"
                          placeholder="How can we help you?"
                          className="border-gray-300 focus:border-[#1B5E20] focus:ring focus:ring-[#E8F5E9] focus:ring-opacity-50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="text-sm font-medium text-gray-700"
                      >
                        Message <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Please describe your inquiry in detail..."
                        className="min-h-[150px] border-gray-300 focus:border-[#1B5E20] focus:ring focus:ring-[#E8F5E9] focus:ring-opacity-50"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] gap-2 px-6 py-2.5 h-auto text-base">
                        Send Message
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.section>

          {/* Office Location Section with Improved Map */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
            id="location"
          >
            <div className="text-center mb-10">
              <span className="inline-block bg-[#E8F5E9] text-[#1B5E20] text-sm font-medium py-1 px-3 rounded-full mb-3">
                Our Location
              </span>
              <TypographyH2 className="text-3xl font-semibold text-gray-900 mb-3">
                Visit Our Office
              </TypographyH2>
              <TypographyP className="text-gray-600 max-w-2xl mx-auto">
                The TTLO is located at the Caraga State University main campus.
                We welcome walk-ins during office hours or you can schedule an
                appointment.
              </TypographyP>
            </div>

            <Card className="border-none shadow-lg overflow-hidden rounded-xl">
              <div className="grid md:grid-cols-3">
                <div className="md:col-span-1 bg-[#1B5E20] text-white p-8">
                  <div className="h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-white/20">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <TypographyH3 className="text-xl font-semibold text-white">
                          Our Address
                        </TypographyH3>
                      </div>

                      <div className="space-y-4 pl-2">
                        <p className="text-white/90">
                          Technology Transfer and Licensing Office
                          <br />
                          Caraga State University
                          <br />
                          Ampayon, Butuan City
                          <br />
                          Agusan del Norte, 8600
                          <br />
                          Philippines
                        </p>

                        <div className="pt-4">
                          <p className="text-white/80 text-sm uppercase font-semibold tracking-wider mb-2">
                            Nearby Landmarks
                          </p>
                          <ul className="space-y-2 text-white/90 text-sm">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              CSU Main Gate
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              Administration Building
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              College of Engineering
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/20">
                      <Button
                        variant="default"
                        className="gap-2 text-white bg-[#2E7D32] hover:bg-[#1B5E20] w-full justify-center shadow-sm"
                        onClick={() =>
                          window.open(
                            "https://goo.gl/maps/YHDuaTfuxsXs2MYq6",
                            "_blank"
                          )
                        }
                      >
                        Get Directions
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="aspect-[16/10] h-full w-full">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235.73731507058605!2d125.59668194896845!3d8.958965442146368!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3301eace4cdd71fb%3A0x31d78f569b7bbb02!2sXH5W%2BHPC%2C%20Butuan%20City%2C%20Agusan%20Del%20Norte!5e1!3m2!1sen!2sph!4v1744437333641!5m2!1sen!2sph"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* FAQ Section */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto pb-20"
            id="support"
          >
            <FAQSection
              title="Contact & Support FAQs"
              description="Find answers to common questions about contacting our office and getting assistance."
              faqs={faqData}
              enableSearch={false}
              icon={<HelpCircle className="h-5 w-5" />}
              iconBgColor="#E8F5E9"
              iconColor="#1B5E20"
              variant="two-column"
              overviewTitle="How Can We Help?"
              overviewDescription="Have questions about intellectual property or need assistance with your application? Our team is ready to help you navigate the IP process and provide expert guidance on protecting your innovations."
            />
          </motion.section>
        </div>
      </main>
      <Footer />
    </>
  );
}
