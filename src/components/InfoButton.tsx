import { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { ArrowUpRight } from './ArrowUpRight';
import { useScrollLock } from '../utils/useScrollLock';

// Info icon SVG component - gray-400 color, 20px
function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.4512 24.9023C10.734 24.9023 9.12272 24.5768 7.61719 23.9258C6.11165 23.2829 4.78923 22.3918 3.6499 21.2524C2.51058 20.1131 1.6154 18.7907 0.964355 17.2852C0.321452 15.7796 0 14.1683 0 12.4512C0 10.734 0.321452 9.12272 0.964355 7.61719C1.6154 6.11165 2.51058 4.78923 3.6499 3.6499C4.78923 2.50244 6.11165 1.60726 7.61719 0.964355C9.12272 0.321452 10.734 0 12.4512 0C14.1683 0 15.7796 0.321452 17.2852 0.964355C18.7907 1.60726 20.1131 2.50244 21.2524 3.6499C22.3918 4.78923 23.2829 6.11165 23.9258 7.61719C24.5768 9.12272 24.9023 10.734 24.9023 12.4512C24.9023 14.1683 24.5768 15.7796 23.9258 17.2852C23.2829 18.7907 22.3918 20.1131 21.2524 21.2524C20.1131 22.3918 18.7907 23.2829 17.2852 23.9258C15.7796 24.5768 14.1683 24.9023 12.4512 24.9023ZM12.4512 22.8271C13.8835 22.8271 15.2262 22.5586 16.4795 22.0215C17.7327 21.4844 18.8354 20.7397 19.7876 19.7876C20.7397 18.8354 21.4844 17.7327 22.0215 16.4795C22.5586 15.2262 22.8271 13.8835 22.8271 12.4512C22.8271 11.0189 22.5586 9.67611 22.0215 8.42285C21.4844 7.16146 20.7397 6.05876 19.7876 5.11475C18.8354 4.1626 17.7327 3.41797 16.4795 2.88086C15.2262 2.34375 13.8835 2.0752 12.4512 2.0752C11.0189 2.0752 9.67611 2.34375 8.42285 2.88086C7.1696 3.41797 6.06689 4.1626 5.11475 5.11475C4.1626 6.05876 3.41797 7.16146 2.88086 8.42285C2.34375 9.67611 2.0752 11.0189 2.0752 12.4512C2.0752 13.8835 2.34375 15.2262 2.88086 16.4795C3.41797 17.7327 4.1626 18.8354 5.11475 19.7876C6.06689 20.7397 7.1696 21.4844 8.42285 22.0215C9.67611 22.5586 11.0189 22.8271 12.4512 22.8271ZM10.3149 19.2749C10.0627 19.2749 9.85107 19.1935 9.68018 19.0308C9.50928 18.868 9.42383 18.6646 9.42383 18.4204C9.42383 18.1763 9.50928 17.9728 9.68018 17.8101C9.85107 17.6473 10.0627 17.5659 10.3149 17.5659H11.8286V11.9629H10.5225C10.2702 11.9629 10.0586 11.8815 9.8877 11.7188C9.7168 11.556 9.63135 11.3525 9.63135 11.1084C9.63135 10.8643 9.7168 10.6608 9.8877 10.498C10.0586 10.3353 10.2702 10.2539 10.5225 10.2539H12.8174C13.1266 10.2539 13.3626 10.3556 13.5254 10.5591C13.6882 10.7544 13.7695 11.0189 13.7695 11.3525V17.5659H15.2832C15.5355 17.5659 15.7471 17.6473 15.918 17.8101C16.0889 17.9728 16.1743 18.1763 16.1743 18.4204C16.1743 18.6646 16.0889 18.868 15.918 19.0308C15.7471 19.1935 15.5355 19.2749 15.2832 19.2749H10.3149ZM12.3413 8.21533C11.9019 8.21533 11.5275 8.06071 11.2183 7.75146C10.909 7.44222 10.7544 7.06787 10.7544 6.62842C10.7544 6.18083 10.909 5.80241 11.2183 5.49316C11.5275 5.18392 11.9019 5.0293 12.3413 5.0293C12.7889 5.0293 13.1632 5.18392 13.4644 5.49316C13.7736 5.80241 13.9282 6.18083 13.9282 6.62842C13.9282 7.06787 13.7736 7.44222 13.4644 7.75146C13.1632 8.06071 12.7889 8.21533 12.3413 8.21533Z" fill="currentColor"/>
    </svg>
  );
}

// X logo path
const xLogoPath = "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

// Horizontal divider line for popup modal
function PopupLine() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div className="absolute bg-[#e5e7eb] inset-0" />
    </div>
  );
}

type ProjectInfo = {
  id: string;
  title: string;
  year: string;
  description: string;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref: string;
};

type InfoButtonProps = {
  project: ProjectInfo;
};

export default function InfoButton({ project }: InfoButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Lock body scroll when modal is open (flicker-free implementation)
  useScrollLock(showModal);

  // Handle modal open animation
  useEffect(() => {
    if (showModal) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      const timer = setTimeout(() => {
        setVideoReady(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setVideoReady(false);
    }
  }, [showModal]);

  const handleOpen = () => {
    setShowModal(true);
    setIsClosing(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <>
      {/* Info Button - absolute top right */}
      <button
        onClick={handleOpen}
        className="absolute top-8 right-8 md:right-16 z-40 cursor-pointer transition-opacity duration-200 hover:opacity-70 text-gray-400"
        aria-label="Project info"
      >
        <InfoIcon />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
            onClick={handleClose} 
          />
          
          {/* Modal Content */}
          <div 
            className={`relative bg-white rounded-3xl flex flex-col w-[calc(100%*6/12)] max-md:w-[95%] max-h-[80vh] overflow-hidden transition-all duration-300 ease-out ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : isClosing 
                  ? 'opacity-0 translate-y-4' 
                  : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Inner container */}
            <div className="flex flex-col flex-1 min-h-0 pt-2 max-md:pt-1 max-md:pb-2">
              {/* Scrollable content area */}
              <div className="overflow-y-auto flex-1">
                {/* Content area with horizontal padding */}
                <div className="content-stretch flex flex-col gap-1 items-start px-8 max-md:px-6 pt-4 pb-8 max-md:py-4 relative shrink-0 w-full">
                  {/* Title row with View on X link */}
                  <div className="flex items-center justify-between w-full">
                    {/* Title */}
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                      <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-xl text-black">
                        {project.title}
                      </p>
                      <p className="font-['Figtree',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[#9ca3af] text-base">
                        •
                      </p>
                      <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-[#9ca3af] text-xl">
                        {project.year}
                      </p>
                    </div>

                    {/* View on X link - top right */}
                    {project.xLink && (
                      <a
                        href={project.xLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="content-stretch flex items-center relative shrink-0 group/xlink"
                      >
                        <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
                          <p className="font-['Figtree',sans-serif] font-normal leading-5 relative shrink-0 text-[#9ca3af] text-base group-hover/xlink:text-blue-500 transition-colors">
                            View on
                          </p>
                          <div className="content-stretch flex items-center justify-center px-[4.667px] py-[6.667px] relative shrink-0 -mr-0.5">
                            <svg 
                              className="block w-[16px] h-[16px] fill-[#9ca3af] group-hover/xlink:fill-blue-500 transition-colors" 
                              viewBox="0 0 19 18"
                            >
                              <path d={xLogoPath} />
                            </svg>
                          </div>
                          <p className="font-['Figtree',sans-serif] font-normal leading-5 relative shrink-0 text-[#9ca3af] text-base group-hover/xlink:text-blue-500 transition-colors">
                            <ArrowUpRight />
                          </p>
                        </div>
                      </a>
                    )}
                  </div>

                  {/* Description */}
                  <div className="content-stretch flex gap-2 items-start relative w-full -mt-1 mb-1">
                    <p className="font-['Figtree',sans-serif] font-normal leading-5 relative text-[#6b7280] text-base">
                      {project.description}
                    </p>
                  </div>

                  {/* Video/Image content area */}
                  <div className="relative rounded-[16px] w-full aspect-[1097/616] overflow-hidden bg-gray-100 shrink-0 mt-3">
                    <img
                      alt=""
                      className="absolute object-cover size-full rounded-[16px]"
                      src={project.imageSrc}
                    />
                    {project.videoSrc && videoReady && (
                      <VideoPlayer
                        key={project.id}
                        src={project.videoSrc}
                        className="absolute object-cover size-full rounded-[16px]"
                        autoPlay
                        muted
                        loop
                        controls={false}
                        muxEnvKey="e4cc19a78gcf0tbtfmu4m7ruf"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
