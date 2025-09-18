"use client";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Platinum1 from "@/assets/ttlo_pics/April 1/Platinum 1.jpg";
import Platinum5 from "@/assets/ttlo_pics/April 1/Platinum 5.jpg";
import Platinum7 from "@/assets/ttlo_pics/April 1/Platinum 7.jpg";
import { TypographyH1, TypographyP } from "@/components/ui/typography";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const headerImages = [Platinum1, Platinum5, Platinum7];

const carouselContent = [
  {
    image: Platinum1,
    title: "TECHNOLOGY TRANSFER AND LICENSING OFFICE",
    subtitle:
      "Your gateway to intellectual property protection and innovation management at Caraga State University",
    cta: {
      text: "Explore Services",
      url: "#services",
    },
  },
  {
    image: Platinum5,
    title: "PROTECT YOUR INNOVATIONS",
    subtitle:
      "We help the university community secure and commercialize their intellectual property",
    cta: {
      text: "Explore Services",
      url: "#services",
    },
  },
  {
    image: Platinum7,
    title: "STREAMLINED IP SERVICES",
    subtitle:
      "Guiding you through every step of the intellectual property process",
    cta: {
      text: "Explore Services",
      url: "#services",
    },
  },
];

export function CarouselHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [api, setApi] = useState<any>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
    },
    [api]
  );

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setFullScreen(true);
  };

  const handleExploreClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(url);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <>
      <div className="relative">
        {/* Full screen button */}
        <button
          onClick={() => openFullScreen(activeIndex)}
          className="absolute top-4 right-4 z-30 bg-black/30 hover:bg-black/50 rounded-full p-2 text-white transition-colors"
          aria-label="View full screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <Carousel
          className="w-full"
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          setApi={setApi}
          onSelect={onSelect}
          opts={{
            loop: true,
            skipSnaps: false,
            dragFree: false,
          }}
        >
          <CarouselContent className="-ml-0">
            {carouselContent.map((slide, index) => (
              <CarouselItem key={index} className="pl-0">
                <div className="relative w-full h-[400px] md:h-[450px]">
                  <Image
                    src={slide.image}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-cover brightness-[0.65]"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/20" />

                  <motion.div
                    className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10"
                    initial="hidden"
                    animate={index === activeIndex ? "visible" : "hidden"}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      variants={titleVariants}
                      className="w-full max-w-4xl mx-auto mb-4"
                    >
                      <TypographyH1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white">
                        {slide.title}
                      </TypographyH1>
                    </motion.div>

                    <motion.div
                      variants={subtitleVariants}
                      className="w-full max-w-2xl mx-auto mb-8"
                    >
                      <TypographyP className="text-base md:text-lg text-white/90">
                        {slide.subtitle}
                      </TypographyP>
                    </motion.div>

                    <motion.div variants={buttonVariants} whileHover="hover">
                      <Button
                        asChild
                        className="bg-[#4CAF50] hover:bg-[#43A047] text-white px-6 py-2 rounded-md font-medium"
                      >
                        <Link
                          href={slide.cta.url}
                          onClick={(e) => handleExploreClick(e, slide.cta.url)}
                          className="flex items-center"
                        >
                          {slide.cta.text}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {carouselContent.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  activeIndex === index
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <CarouselPrevious className="left-4 bg-black/30 hover:bg-black/50 text-white border-none absolute" />
          <CarouselNext className="right-4 bg-black/30 hover:bg-black/50 text-white border-none absolute" />
        </Carousel>
      </div>

      {/* Full screen dialog */}
      <Dialog open={fullScreen} onOpenChange={setFullScreen}>
        <DialogContent className="max-w-[95vw] w-full p-0 h-[92vh] max-h-[92vh] bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20">
          <DialogTitle className="sr-only">Gallery View</DialogTitle>
          <DialogDescription className="sr-only">
            Detailed view of selected image
          </DialogDescription>

          {/* Close button with enhanced positioning */}
          <button
            onClick={() => setFullScreen(false)}
            className="absolute top-6 right-6 z-50 group"
            aria-label="Close gallery view"
          >
            <div className="bg-black/10 backdrop-blur-md border border-white/20 rounded-full p-3 transition-all duration-300 group-hover:bg-black/20">
              <X className="h-5 w-5 text-black/70 group-hover:text-black/90" />
            </div>
          </button>

          <div className="grid grid-cols-[1.8fr,1fr] h-full">
            {/* Left Column - Enhanced Image Display */}
            <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-white overflow-hidden">
              {/* Main image container with better proportions */}
              <div className="relative h-full flex items-center justify-center p-12">
                <div className="relative w-full h-full max-h-[85vh]">
                  <Image
                    src={carouselContent[fullScreenIndex].image}
                    alt={`View of ${carouselContent[fullScreenIndex].title}`}
                    fill
                    className="object-contain transition-all duration-500"
                    priority
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 65vw"
                  />
                </div>
              </div>

              {/* Enhanced image counter */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/5 backdrop-blur-md border border-black/10 rounded-full px-6 py-2">
                  <p className="text-black/70 text-sm font-medium">
                    {fullScreenIndex + 1} of {carouselContent.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Enhanced Content Layout */}
            <div className="relative h-full bg-white border-l border-gray-100">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                <div className="p-10 space-y-8">
                  {/* Enhanced Header Section */}
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-600 tracking-wide uppercase">
                        Featured Content
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        {carouselContent[fullScreenIndex].title}
                      </h2>
                      <p className="text-base text-gray-600 leading-relaxed text-justify">
                        {carouselContent[fullScreenIndex].subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Feature Cards */}
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="group p-6 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <ArrowRight className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">
                              Innovation Excellence
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed text-justify">
                              Fostering groundbreaking research and development
                              through comprehensive IP support and guidance.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="group p-6 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Maximize2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">
                              IP Protection
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed text-justify">
                              Securing and managing intellectual property rights
                              with expert guidance and support.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Info Grid */}
                  <div className="rounded-xl bg-gray-50 p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Quick Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Category</p>
                        <p className="font-medium text-gray-900">
                          Intellectual Property
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Services</p>
                        <p className="font-medium text-gray-900">
                          IP Registration
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Support</p>
                        <p className="font-medium text-gray-900">
                          24/7 Assistance
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location</p>
                        <p className="font-medium text-gray-900">
                          Caraga State University
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="pt-4">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-300"
                      onClick={() => {
                        setFullScreen(false);
                        const element = document.querySelector(
                          carouselContent[fullScreenIndex].cta.url
                        );
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom styles for scrollbar */}
          <style jsx global>{`
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(0, 0, 0, 0.2);
              border-radius: 3px;
            }
          `}</style>
        </DialogContent>
      </Dialog>
    </>
  );
}
