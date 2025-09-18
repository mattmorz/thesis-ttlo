"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logo.avif";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Calendar,
  ExternalLink,
  FileText,
  Search,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      // In a real app, you would send this to your backend
      console.log("Subscribed with email:", email);
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const resourceLinks = [
    {
      text: "About Us",
      url: "/about",
      icon: <ExternalLink className="h-4 w-4" />,
      tooltip: "Learn about TTLO's mission and team",
    },
    {
      text: "Submit IP Application",
      url: "/forms",
      icon: <FileText className="h-4 w-4" />,
      tooltip: "Start your IP application process",
    },
    {
      text: "Track Applications",
      url: "/projects",
      icon: <Search className="h-4 w-4" />,
      tooltip: "Monitor your ongoing submissions",
    },
    {
      text: "IP Guidelines",
      url: "/guidelines/introduction",
      icon: <BookOpen className="h-4 w-4" />,
      tooltip: "Access IP protection resources",
    },
    {
      text: "Contact Support",
      url: "/contact",
      icon: <MessageSquare className="h-4 w-4" />,
      tooltip: "Get help with your questions",
    },
  ];

  const contactLinks = [
    {
      text: "CSU Campus",
      url: "#",
      icon: <MapPin className="h-4 w-4" />,
      tooltip: "Main campus location",
    },
    {
      text: "TTLO Office",
      url: "#",
      icon: <MapPin className="h-4 w-4" />,
      tooltip: "TTLO office location",
    },
    {
      text: "ttlo@carsu.edu.ph",
      url: "mailto:ttlo@carsu.edu.ph",
      icon: <Mail className="h-4 w-4" />,
      tooltip: "Send us an email",
    },
    {
      text: "(085) 123-4567",
      url: "tel:+6385123456",
      icon: <Phone className="h-4 w-4" />,
      tooltip: "Call our office",
    },
  ];

  const officeHours = [
    {
      text: "Mon-Fri",
      url: "#",
      icon: <Calendar className="h-4 w-4" />,
      tooltip: "Weekday operations",
    },
    {
      text: "8AM-5PM",
      url: "#",
      icon: <Clock className="h-4 w-4" />,
      tooltip: "Office hours",
    },
    {
      text: "Closed: Weekends",
      url: "#",
      icon: <Calendar className="h-4 w-4" />,
      tooltip: "Weekend schedule",
    },
  ];

  return (
    <TooltipProvider>
      <footer className="bg-[#1B5E20] text-white">
        <div className="container mx-auto py-6 px-4">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-4">
            {/* Logo and newsletter section */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-1.5 rounded-full w-10 h-10 flex items-center justify-center">
                  <Image
                    src={Logo}
                    alt="TTLO Logo"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                    sizes="24px"
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-lg font-bold">CSU TTLO</p>
                  <p className="text-sm text-green-100">
                    Technology Transfer and Licensing Office
                  </p>
                </div>
              </div>

              <p className="text-sm text-green-100 leading-relaxed">
                Your gateway to intellectual property protection and innovation
                management at Caraga State University. We help innovators,
                researchers, and entrepreneurs protect and commercialize their
                intellectual assets.
              </p>

              {/* Newsletter subscription */}
              <div className="bg-[#165719] rounded-md p-4 mt-3">
                <p className="text-sm font-medium mb-2">Stay Updated</p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-sm bg-white/10 border-0 text-white placeholder:text-green-100"
                    required
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 px-3 bg-[#4CAF50] hover:bg-[#43A047]"
                    aria-label="Subscribe"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    <span>Subscribe</span>
                  </Button>
                </form>
                {subscribed && (
                  <p className="text-green-200 text-xs mt-2">
                    Thank you for subscribing!
                  </p>
                )}
              </div>
            </div>

            {/* Links sections */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Resources */}
                <div>
                  <h3 className="text-sm font-bold mb-3 pb-1 border-b border-white/20">
                    Resources
                  </h3>
                  <ul className="space-y-2.5">
                    {resourceLinks.map((link, i) => (
                      <li key={i} className="text-sm text-green-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={link.url}
                              className="hover:text-white transition-colors flex items-center gap-2"
                            >
                              <span className="flex-shrink-0 p-1 bg-[#165719] rounded-full">
                                {link.icon}
                              </span>
                              <span>{link.text}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-[#1B5E20] border-0"
                          >
                            {link.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-sm font-bold mb-3 pb-1 border-b border-white/20">
                    Contact
                  </h3>
                  <ul className="space-y-2.5">
                    {contactLinks.map((link, i) => (
                      <li key={i} className="text-sm text-green-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={link.url}
                              className="hover:text-white transition-colors flex items-center gap-2"
                            >
                              <span className="flex-shrink-0 p-1 bg-[#165719] rounded-full">
                                {link.icon}
                              </span>
                              <span>{link.text}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-[#1B5E20] border-0"
                          >
                            {link.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Office Hours */}
                <div>
                  <h3 className="text-sm font-bold mb-3 pb-1 border-b border-white/20">
                    Office Hours
                  </h3>
                  <ul className="space-y-2.5">
                    {officeHours.map((link, i) => (
                      <li key={i} className="text-sm text-green-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={link.url}
                              className="hover:text-white transition-colors flex items-center gap-2"
                            >
                              <span className="flex-shrink-0 p-1 bg-[#165719] rounded-full">
                                {link.icon}
                              </span>
                              <span>{link.text}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-[#1B5E20] border-0"
                          >
                            {link.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs text-green-100">
                © {new Date().getFullYear()} CSU Technology Transfer and
                Licensing Office. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link
                  href="/terms"
                  className="text-xs text-green-100 hover:text-white"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-xs text-green-100 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </TooltipProvider>
  );
}
