import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { ProjectMissionHeader, ProtectedContent, Gallery, AlsoCheckOut } from "./index";
import Footer from "../Footer";
import lockIcon from "../../assets/lock.svg";
import appleLogo from "../../assets/apple/Apple+Logo.webp";
import appleGallery1 from "../../assets/apple/AP1.webp";
import appleGallery2 from "../../assets/apple/AP2.webp";
import appleGallery3 from "../../assets/apple/AP3.webp";
import appleGallery4 from "../../assets/apple/AP4.webp";

// Close icon SVG
const CloseIcon = () => (
  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
    <path
      d="M9.76256 1.17736C10.0791 0.860788 10.0791 0.347859 9.76256 0.031284C9.44599 -0.285291 8.93306 -0.285291 8.61648 0.031284L5 3.64776L1.38352 0.031284C1.06694 -0.285291 0.554014 -0.285291 0.237439 0.031284C-0.0791362 0.347859 -0.0791362 0.860788 0.237439 1.17736L3.85392 4.79384L0.237439 8.41032C-0.0791362 8.7269 -0.0791362 9.23982 0.237439 9.5564C0.554014 9.87297 1.06694 9.87297 1.38352 9.5564L5 5.93992L8.61648 9.5564C8.93306 9.87297 9.44599 9.87297 9.76256 9.5564C10.0791 9.23982 10.0791 8.7269 9.76256 8.41032L6.14608 4.79384L9.76256 1.17736Z"
      fill="currentColor"
    />
  </svg>
);

// Back arrow icon SVG (arrow-up-left)
const BackArrowIcon = () => (
  <svg className="block size-full" fill="none" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L6.5 7.56066V13.25C6.5 13.6642 6.16421 14 5.75 14C5.33579 14 5 13.6642 5 13.25V5.75C5 5.33579 5.33579 5 5.75 5H13.25C13.6642 5 14 5.33579 14 5.75C14 6.16421 13.6642 6.5 13.25 6.5H7.56066L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803Z"
      fill="currentColor"
    />
  </svg>
);

// Horizontal line separator
function Line() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div className="absolute bg-[#e5e7eb] inset-0" />
    </div>
  );
}

// Metadata item type
type MetadataItem = {
  label: string;
  value: string | string[];
};

type AppleProjectModalProps = {
  onClose: () => void;
  onBack?: () => void;
  onProjectClick?: (projectId: string) => void;
  onViewAllProjects?: () => void;
};

// Related projects for "Also check out" section
const relatedProjects = [
  {
    id: "roblox",
    title: "Roblox",
    year: "2024",
    description: "Reimagining the future of social gameplay and user communication.",
    imageSrc: "https://image.mux.com/01FcKJdkUWAarvsEU6iti801x025X2gTxxYCqhRflroCL8/thumbnail.png",
  },
  {
    id: "adobe",
    title: "Adobe",
    year: "2023",
    description: "Product strategy to drive user acquisition on college campuses.",
    imageSrc: "https://image.mux.com/15z5wuJU62pEJRzHyxUymxTaUeUwbpMD6jdujLx888M/thumbnail.png",
  },
];

// Apple project data
const appleProjectData = {
  logoSrc: appleLogo,
  title: "Project Title",
  metadata: [
    { label: "Timeline", value: "Jun - Sep 2025" },
    { label: "Org", value: "Team Name" },
    { label: "Role", value: "Product Design Intern" },
    { label: "With", value: ["First Last", "First Last"] },
    { label: "Location", value: "Cupertino, CA" },
  ] as MetadataItem[],
  heroImageSrc: "https://image.mux.com/mO00LSDA3cQYKHdNhgbgYoQfaffVw2ZLzbJbVY0227kmU/thumbnail.png",
  missionTitle: "Designing new features to drive user engagement and advance health research.",
  missionDescription: [
    "This summer, I joined the Health Special Projects as a product design intern to lead the end-to-design of a new user facing feature.",
    "Working closely with engineers, data scientists, clinical partners, marketing, & our design team, I led initial research & concept exploration, crafted interactive prototypes, and oversaw the engineering implementation of my designs.",
    "The work culminated in multiple director-level reviews and presentation to the Vice President of Health Software, receiving approval for future release.",
    "Grateful to the many amazing designers, engineers, & collaborators who've inspired me with their meticulous dedication to continue building intuitive (& beautiful!) products.",
  ],
  galleryImages: [
    { src: appleGallery1, alt: "Apple Gallery 1" },
    { src: appleGallery2, alt: "Apple Gallery 2" },
    { src: appleGallery3, alt: "Apple Gallery 3" },
    { src: appleGallery4, alt: "Apple Gallery 4" },
  ],
};

// Logo component for fullscreen header
const LogoIcon = ({ isCompact }: { isCompact?: boolean }) => (
  <img
    src="/logo.png"
    alt="Michelle Liu"
    className={clsx(
      "object-cover transition-all duration-300 ease-out",
      isCompact ? "size-[44px]" : "size-[60px]"
    )}
  />
);

export default function AppleProjectModal({
  onClose,
  onBack,
  onProjectClick,
  onViewAllProjects,
}: AppleProjectModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Trigger enter animation on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Handle scroll to toggle compact header
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isFullscreen) return;

    const handleScroll = () => {
      // Activate compact mode after scrolling 20px
      const shouldBeCompact = scrollContainer.scrollTop > 20;
      setIsHeaderCompact(shouldBeCompact);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [isFullscreen]);

  // Reset compact header when exiting fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setIsHeaderCompact(false);
    }
  }, [isFullscreen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleExpandToFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleBack = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else if (onBack) {
      setIsClosing(true);
      setIsVisible(false);
      setTimeout(() => {
        onBack();
      }, 300);
    }
  };

  return (
    <div className={clsx(
      "fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ease-out",
      isFullscreen ? "px-0" : "px-8 max-md:px-4"
    )}>
      {/* Overlay */}
      <div
        className={clsx(
          "absolute inset-0 bg-black/20 transition-opacity duration-500",
          isVisible && !isFullscreen ? "opacity-100" : "opacity-0",
          isFullscreen && "pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={clsx(
          "relative bg-white flex flex-col overflow-hidden transition-all duration-500 ease-out",
          isFullscreen
            ? "w-full h-full rounded-none"
            : "rounded-[26px] w-[calc(100%*10/12)] max-md:w-full max-h-[83.33vh]",
          isVisible
            ? "opacity-100 translate-y-0"
            : isClosing
            ? "opacity-0 translate-y-4"
            : "opacity-0 translate-y-8"
        )}
      >
        {/* Header - different for fullscreen vs modal */}
        {isFullscreen ? (
          /* Fullscreen header with logo */
          <div className={clsx(
            "content-stretch flex flex-col items-start px-16 relative shrink-0 w-full sticky top-0 z-10 transition-all duration-300 ease-out",
            isHeaderCompact ? "py-4" : "py-8"
          )}>
            {/* Gradient background that extends below header */}
            <div 
              className="absolute inset-x-0 top-0 pointer-events-none" 
              style={{ 
                height: '200px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 100%)'
              }} 
            />
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
              <button
                onClick={handleBack}
                className={clsx(
                  "overflow-clip relative shrink-0 cursor-pointer hover:opacity-80 transition-all duration-300 ease-out",
                  isHeaderCompact ? "size-[44px]" : "size-[60px]"
                )}
              >
                <LogoIcon isCompact={isHeaderCompact} />
              </button>
            </div>
          </div>
        ) : (
          /* Modal header with back and close buttons */
          <div className="content-stretch flex items-start justify-between px-7 py-6 relative shrink-0 w-full sticky top-0 bg-white z-10">
            {/* Back/Expand button */}
            <button
              onClick={handleExpandToFullscreen}
              className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer rounded-full hover:bg-[#F3F4F6] transition-colors duration-200 ease-out text-[#4b5563]"
            >
              <div className="relative shrink-0 size-5">
                <BackArrowIcon />
              </div>
            </button>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer rounded-full hover:bg-[#F3F4F6] transition-colors duration-200 ease-out text-[#4b5563]"
            >
              <div className="overflow-clip relative shrink-0 size-2.5">
                <CloseIcon />
              </div>
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="overflow-y-auto flex-1">
          {/* Project Hero Header - inline version for modal */}
          <div className="content-stretch flex flex-col gap-8 items-start justify-center px-[175px] max-md:px-8 py-16 relative shrink-0 w-full">
            {/* Logo */}
            <div className="relative shrink-0 size-20 rounded-[16px] overflow-hidden">
              <img
                className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                alt=""
                src={appleProjectData.logoSrc}
              />
            </div>

            {/* Title and Metadata */}
            <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
              {/* Title */}
              <p className="font-normal leading-5 relative shrink-0 text-4xl text-black">
                {appleProjectData.title}
              </p>

              {/* Metadata Grid */}
              <div className="content-stretch flex gap-5 items-start relative shrink-0 w-full max-md:grid max-md:grid-cols-2 max-md:gap-4">
                {appleProjectData.metadata.map((item) => (
                  <div
                    key={item.label}
                    className="content-stretch flex flex-col gap-3 items-start leading-5 relative shrink-0 text-base flex-[1_0_0] min-h-px min-w-px whitespace-pre-wrap"
                  >
                    <p className="font-semibold relative shrink-0 text-[#9ca3af]">
                      {item.label}
                    </p>
                    <p className="font-normal relative shrink-0 text-black">
                      {Array.isArray(item.value) ? (
                        item.value.map((v, i) => (
                          <React.Fragment key={i}>
                            {v}
                            {i < item.value.length - 1 && <br />}
                          </React.Fragment>
                        ))
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator Line */}
            <Line />

            {/* Hero Image */}
            <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full">
              <div className="aspect-[1090/591] relative rounded-[26px] shrink-0 w-full">
                <img
                  className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                  alt=""
                  src={appleProjectData.heroImageSrc}
                />
              </div>
            </div>
          </div>

          {/* Mission / Overview Section - two column layout with 1/5 gap */}
          <div className="content-stretch grid grid-cols-[2fr_1fr_2fr] items-start px-[175px] max-md:px-8 py-16 relative shrink-0 w-full max-md:flex max-md:flex-col max-md:gap-8">
            {/* Left: Label + Title */}
            <div className="content-stretch flex flex-col gap-5 items-start relative col-start-1">
              <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
                The Mission
              </p>
              <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
                {appleProjectData.missionTitle}
              </p>
            </div>

            {/* Right: Description */}
            <div className="leading-5 relative text-[#4b5563] text-base whitespace-pre-wrap col-start-3 max-md:col-start-auto max-md:w-full">
              {appleProjectData.missionDescription.map((paragraph, index) => (
                <p key={index} className={index < appleProjectData.missionDescription.length - 1 ? "mb-4" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Protected Content / Confidential Section */}
          <div className="content-stretch flex flex-col items-start px-[175px] max-md:px-8 py-16 relative shrink-0 w-full">
            <div className="bg-[#f9fafb] content-stretch flex flex-col items-center justify-center overflow-clip p-16 max-md:p-8 relative rounded-[26px] shrink-0 w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-8 items-start justify-center relative shrink-0">
                  {/* Lock Icon with shadow (matches Figma exactly) */}
                  <div className="relative shrink-0 size-[60px]">
                    {/* Circle with subtle shadow */}
                    <div className="absolute inset-0 rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08)] flex items-center justify-center">
                      <img src={lockIcon} alt="" className="w-[19px] h-[28px]" />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="content-stretch flex flex-col gap-2 items-start opacity-60 relative shrink-0 w-[424px] max-md:w-full whitespace-pre-wrap">
                    <p className="leading-7 relative shrink-0 text-2xl text-black w-full">
                      Confidential
                    </p>
                    <p className="leading-6 relative shrink-0 text-[#6b7280] text-lg">
                      Interested? Please{" "}
                      <a
                        href="mailto:michelletheresaliu@gmail.com"
                        className="underline decoration-solid hover:text-blue-500 transition-colors"
                      >
                        email me
                      </a>
                      !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="content-stretch flex gap-4 items-center px-[175px] max-md:px-8 py-16 relative w-full max-md:grid max-md:grid-cols-2">
            {appleProjectData.galleryImages.map((image, index) => (
              <div
                key={index}
                className="aspect-[200/300] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px overflow-clip relative rounded-[26px] shadow-[0px_2px_8px_0px_#eaeaea] shrink-0"
              >
                <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[26px] shrink-0 w-full">
                  <img
                    className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                    alt={image.alt || ""}
                    src={image.src}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Also Check Out Section */}
          <div className="content-stretch flex flex-col gap-16 items-start justify-center px-[175px] max-md:px-8 py-16 relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-8 items-start relative shrink-0 w-full">
              {/* Section Title */}
              <p className="font-normal leading-7 relative shrink-0 text-[#6b7280] text-xl w-full whitespace-pre-wrap">
                Also check out...
              </p>

              {/* Projects Grid */}
              <div className="content-stretch flex gap-4 items-center relative shrink-0 w-full max-md:flex-col">
                {relatedProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onProjectClick?.(project.id)}
                    className="content-stretch flex flex-[1_0_0] flex-col gap-3 items-start min-h-px min-w-px relative shrink-0 cursor-pointer group text-left max-md:w-full max-md:flex-none"
                  >
                    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]">
                      <div className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full">
                        <img
                          className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                          alt=""
                          src={project.imageSrc}
                        />
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col font-medium items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-base whitespace-pre-wrap w-full">
                      <p className="relative shrink-0 text-[#111827] w-full">
                        <span>{project.title} </span>
                        <span className="text-[#9ca3af]">• {project.year}</span>
                      </p>
                      <p className="relative shrink-0 text-[#9ca3af] w-full font-normal project-card-text">
                        {project.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* View All Button */}
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <button
                onClick={onViewAllProjects}
                className="bg-[#f9fafb] border border-[#e5e7eb] border-solid content-stretch flex items-center justify-center px-5 py-2.5 relative rounded-full shrink-0 hover:bg-[#f3f4f6] transition-colors cursor-pointer"
              >
                <span className="font-semibold leading-normal relative shrink-0 text-[#4b5563] text-base tracking-[0.16px]">
                  View all projects
                </span>
              </button>
            </div>
          </div>

          {/* Footer - only shown in fullscreen mode */}
          {isFullscreen && <Footer />}
        </div>
      </div>
    </div>
  );
}
