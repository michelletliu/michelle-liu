import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { domToPng } from 'modern-screenshot';

// Import assets from the polaroid folder
import imgDefaultPhoto from '../../assets/polaroid/da0162d03b0f8405da5f70fbba04c6dd8720ada0.png';
import imgInstagramIcon from '../../assets/polaroid/fcadb86f9e7ac3194098e501064eb43213cdfff1.png';
import imgMessagesIcon from '../../assets/polaroid/dd3b1a5ed7db644c197314328f647774bd86226e.png';
import imgLinkedInIcon from '../../assets/polaroid/f81f194aee98efdd62a97e659006efa986492874.png';
import imgMailIcon from '../../assets/polaroid/7d8c54338d14a1f9afdfff1bec90c42375e5050e.png';
import imgXIcon from '../../assets/polaroid/a643fce02520f3d992e6b432fa72fab473a1ca7e.png';
import imgLogo from '../../assets/logo.png';

type ColorOption = {
  id: string;
  fill: string;
  fillHover: string;
  tint: string;
  border: string;
};

const colors: ColorOption[] = [
  { id: 'red', fill: '#FF383C', fillHover: '#E32226', tint: 'rgba(255, 56, 60, 0.15)', border: '#f0c8c9' },
  { id: 'orange', fill: '#FF8D28', fillHover: '#E67A1C', tint: 'rgba(255, 141, 40, 0.15)', border: '#ffe0c8' },
  { id: 'yellow', fill: '#FFCC00', fillHover: '#E6B800', tint: 'rgba(255, 204, 0, 0.15)', border: '#fff2cc' },
  { id: 'green', fill: '#34C759', fillHover: '#2DB04C', tint: 'rgba(52, 199, 89, 0.15)', border: '#d4eedd' },
  { id: 'cyan', fill: '#00C3D0', fillHover: '#00A8B5', tint: 'rgba(0, 195, 208, 0.1)', border: '#acc8c9' },
  { id: 'blue', fill: '#0088FF', fillHover: '#0070D9', tint: 'rgba(0, 136, 255, 0.15)', border: '#cce5ff' },
  { id: 'purple', fill: '#6155F5', fillHover: '#4E3FE0', tint: 'rgba(97, 85, 245, 0.15)', border: '#d1d0e0' },
];

function ColorButton({ 
  color, 
  isSelected, 
  onClick 
}: { 
  color: ColorOption; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (isSelected) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative shrink-0 size-[30px] cursor-pointer group"
        aria-label={`Select ${color.id} color`}
      >
        <div className="absolute inset-[-20%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 42">
            <g>
              <circle 
                cx="21" 
                cy="21" 
                fill={isHovered ? color.fillHover : color.fill} 
                opacity="0.7" 
                r="15" 
                className="transition-all duration-200" 
              />
              <circle cx="21" cy="21" opacity="0.7" r="19.5" stroke="#0088FF" strokeWidth="3" />
            </g>
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative shrink-0 size-[30px] cursor-pointer group"
      aria-label={`Select ${color.id} color`}
    >
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g opacity="0.7">
          <circle 
            cx="15" 
            cy="15" 
            fill={isHovered ? color.fillHover : color.fill} 
            r="15" 
            className="transition-all duration-200" 
          />
        </g>
      </svg>
    </button>
  );
}

export default function PolaroidPage() {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showText, setShowText] = useState(false);
  const [caption, setCaption] = useState('');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle entrance animation
  useEffect(() => {
    // Small delay to ensure initial state renders first
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation back to home with smooth transition
  const handleBackToHome = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/');
    }, 400); // Wait for fade-out animation to complete
  };

  // Parse URL params on mount to restore shared polaroid state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const colorId = params.get('color');
    if (colorId) {
      const color = colors.find(c => c.id === colorId);
      if (color) setSelectedColor(color);
    }
    
    const captionParam = params.get('caption');
    if (captionParam) {
      setCaption(decodeURIComponent(captionParam));
      setShowText(true);
    }
    
    const dateParam = params.get('date');
    if (dateParam === 'true') {
      setShowDate(true);
    }
  }, []);
  const polaroidRef = useRef<HTMLDivElement>(null);

  // Handle window focus to detect when file dialog is closed (including cancel)
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isFileDialogOpen) {
        // Small delay to let onChange fire first if a file was selected
        setTimeout(() => {
          setIsFileDialogOpen(false);
          setShowUploadOverlay(false);
        }, 100);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isFileDialogOpen]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');

  const handleRestart = () => {
    setSelectedColor(null);
    setShowDate(false);
    setShowText(false);
    setCaption('');
    setIsEditingCaption(false);
    setUploadedImage(null);
  };

  const handleDownload = async () => {
    if (!polaroidRef.current) return;
    
    try {
      // Use modern-screenshot to capture the polaroid as PNG
      const dataUrl = await domToPng(polaroidRef.current, {
        scale: 3, // Higher resolution for better quality
        backgroundColor: null, // Transparent background for rounded corners
      });
      
      // Create download link with filename PolaroidStudio[Date].png
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `PolaroidStudio${currentDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to download polaroid:', error);
    }
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    if (selectedColor) {
      params.set('color', selectedColor.id);
    }
    if (caption) {
      params.set('caption', encodeURIComponent(caption));
    }
    if (showDate) {
      params.set('date', 'true');
    }
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  const handleCopyLink = async () => {
    const shareUrl = generateShareUrl();
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyLinkSuccess(true);
        setTimeout(() => setCopyLinkSuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy link:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleShareToApp = async (appName: string) => {
    const shareUrl = generateShareUrl();
    const shareText = 'Check out my Polaroid!';
    
    const shareUrls: { [key: string]: string } = {
      Instagram: `https://www.instagram.com/`,
      Messages: `sms:&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      AirDrop: shareUrl,
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      Mail: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`,
      X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    };

    if ((appName === 'AirDrop' || appName === 'Messages') && navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.log('Share cancelled or failed');
        if (appName === 'Messages') {
          window.location.href = shareUrls[appName];
        }
        return;
      }
    }

    if (appName === 'Instagram') {
      alert('Instagram sharing would open the Instagram app here. Link copied to clipboard!');
      return;
    }

    if (shareUrls[appName]) {
      if (appName === 'Messages') {
        window.location.href = shareUrls[appName];
      } else {
        window.open(shareUrls[appName], '_blank');
      }
    }
  };

  const handleImageHoverStart = () => {
    const timer = setTimeout(() => {
      setShowUploadOverlay(true);
    }, 100);
    setHoverTimer(timer);
  };

  const handleImageHoverEnd = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    // Don't hide overlay if file dialog is open
    if (!isFileDialogOpen) {
      setShowUploadOverlay(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate that the file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (e.g., .jpg, .png, .gif)');
        setIsFileDialogOpen(false);
        setShowUploadOverlay(false);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setIsFileDialogOpen(false);
        setShowUploadOverlay(false);
        // Reset input value so the same file can be re-uploaded
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
        setIsFileDialogOpen(false);
        setShowUploadOverlay(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className={`relative size-full min-h-screen px-4 transition-all ease-out ${
        isExiting ? 'opacity-0 scale-[0.98]' : isEntering ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
      }`}
      style={{ 
        backgroundImage: "linear-gradient(133.216deg, rgba(151, 191, 255, 0.2) 10.334%, rgba(151, 191, 255, 0) 94.005%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
        transitionDuration: isExiting ? '400ms' : '500ms'
      }}
      onClick={() => {
        setIsDateFocused(false);
        setIsTextFocused(false);
      }}
    >
      {/* Logo - acts as back button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-8 left-8 z-20 cursor-pointer hover:opacity-80 hover:scale-95 transition-all duration-200"
        aria-label="Go back to home"
      >
        <img 
          src={imgLogo} 
          alt="Michelle Liu Logo" 
          className="w-[44px] h-[44px] object-contain"
        />
      </button>

      <div className="flex flex-col gap-[32px] md:gap-[48px] items-center w-full max-w-[583px] mx-auto min-h-screen justify-center py-8">
        {/* Title */}
        <div 
          className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-2xl md:text-3rxl text-black text-center text-nowrap" 
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          <p className="">
            <span>Polaroid </span>
            <span className="text-[rgba(0,0,0,0.4)]">Studio</span>
          </p>
        </div>

        {/* Polaroid Frame */}
        <div 
          ref={polaroidRef}
          className="content-stretch flex h-[320px] md:h-[393.22px] items-center justify-center relative rounded-[5.5px] md:rounded-[6.78px] shadow-[0px_2.5px_16px_0px_rgba(0,0,0,0.15)] md:shadow-[0px_3.39px_20.339px_0px_rgba(0,0,0,0.15)] shrink-0 w-[274px] md:w-[337.288px] transition-transform duration-300 ease-out hover:rotate-2">
          <div className="h-[320px] md:h-[393.22px] relative rounded-[5.5px] md:rounded-[6.78px] shrink-0 w-[274px] md:w-[337.288px]">
            <div className="absolute contents left-0 top-0">
              <div className="absolute contents left-0 top-0">
                <div 
                  className="absolute blur-[0.25px] filter h-full left-0 rounded-[5.5px] md:rounded-[6.78px] top-0 w-full"
                  style={{ 
                    backgroundColor: selectedColor ? selectedColor.tint : 'white',
                  }}
                >
                  <div 
                    aria-hidden="true" 
                    className="absolute border-[1.38px] md:border-[1.695px] border-solid inset-[-1.38px] md:inset-[-1.695px] pointer-events-none rounded-[6.88px] md:rounded-[8.475px]"
                    style={{
                      borderColor: selectedColor ? selectedColor.border : 'rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              </div>
              <div 
                className="absolute content-stretch flex items-center left-0 pb-[62px] md:pb-[76.271px] pt-[16.5px] md:pt-[20.339px] px-[16.5px] md:px-[20.339px] rounded-[5.5px] md:rounded-[6.78px] top-0"
                style={{ 
                  backgroundColor: selectedColor ? selectedColor.tint : 'white',
                }}
              >
                <div 
                  className="relative rounded-[2.75px] md:rounded-[3.39px] shrink-0 w-[241px] h-[241px] md:w-[296.61px] md:h-[296.61px]"
                  onMouseEnter={handleImageHoverStart}
                  onMouseLeave={handleImageHoverEnd}
                >
                  <div className="overflow-clip relative rounded-[inherit] size-full">
                    {uploadedImage ? (
                      /* Uploaded image - preserve aspect ratio and center */
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[4.7px] md:rounded-[5.773px] bg-[#f5f5f5]">
                        <img 
                          alt="Polaroid photo" 
                          className="max-w-full max-h-full w-auto h-auto object-contain" 
                          src={uploadedImage} 
                        />
                      </div>
                    ) : (
                      /* Default photo - original styling */
                      <div className="absolute h-[241px] md:h-[296.61px] left-[-29px] md:left-[-35.59px] rounded-[4.7px] md:rounded-[5.773px] top-0 w-[325px] md:w-[400.291px]">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[4.7px] md:rounded-[5.773px]">
                          <img 
                            alt="Polaroid photo" 
                            className="absolute h-full left-[-4.86%] max-w-none top-0 w-[109.72%]" 
                            src={imgDefaultPhoto} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Hidden file input - always in DOM so onChange fires properly */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                    aria-hidden="true"
                  />
                  
                  {/* Upload Overlay */}
                  {showUploadOverlay && (
                    <>
                      <div className="absolute bg-[rgba(196,196,196,0.5)] inset-0 rounded-[3.39px] transition-all duration-500 ease-in-out animate-fade-in" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <button 
                          type="button"
                          onClick={() => {
                            setIsFileDialogOpen(true);
                            fileInputRef.current?.click();
                          }}
                          className="cursor-pointer block transition-all duration-500 ease-in-out animate-scale-in-centered"
                        >
                          <div className="bg-white content-stretch flex gap-[12px] items-center px-[16px] py-[12px] rounded-[999px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] hover:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out">
                            <div aria-hidden="true" className="absolute border border-[#bfbfbf] border-solid inset-0 pointer-events-none rounded-[999px]" />
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(60,60,67,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="font-['SF_Pro','-apple-system',sans-serif] text-[17px] text-[rgba(60,60,67,0.6)] tracking-[-0.43px] whitespace-nowrap">
                              Upload Your Own
                            </span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                  
                  <div 
                    aria-hidden="true" 
                    className="absolute border-[0.847px] border-solid inset-0 pointer-events-none rounded-[3.39px]"
                    style={{
                      borderColor: selectedColor ? `${selectedColor.fill}4D` : 'rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date Text */}
          {showDate && (
            <div 
              className="absolute flex flex-col justify-center leading-[0] left-[229.7px] md:left-[282.7px] not-italic text-[13.8px] md:text-[16.949px] text-[rgba(0,0,0,0.4)] text-center text-nowrap top-[301.5px] md:top-[370.72px] tracking-[0.15em] -translate-x-1/2 -translate-y-1/2"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              <p className="leading-[23.4px] md:leading-[28.814px]">{currentDate}</p>
            </div>
          )}

          {/* Caption Text Box */}
          {showText && (
            <div 
              className="absolute content-stretch flex items-center left-[10px] md:left-[12.3px] px-[6.5px] md:px-[8px] py-[3.25px] md:py-[4px] top-[260.2px] md:top-[320.29px]"
            >
              <div className="content-stretch flex items-center relative shrink-0">
                <div 
                  className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[14.6px] md:text-[18px] text-black text-center text-nowrap tracking-[0.15em]"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  <p className="leading-[24.4px] md:leading-[30px]">{caption}</p>
                </div>
                {isEditingCaption && (
                  <div className="h-[24.4px] md:h-[30px] relative shrink-0 w-[1.6px] md:w-[2px] ml-[1.6px] md:ml-[2px] animate-blink">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 30">
                      <path d="M1 2L1 28" stroke="#0088FF" strokeLinecap="round" strokeWidth="2" />
                    </svg>
                  </div>
                )}
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onFocus={() => setIsEditingCaption(true)}
                  onBlur={() => {
                    setIsEditingCaption(false);
                    if (caption.trim() === '') {
                      setShowText(false);
                      setIsTextFocused(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setIsTextFocused(false);
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder=""
                  className="absolute inset-0 opacity-0 cursor-text"
                  style={{ width: '300px' }}
                  maxLength={20}
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="content-stretch flex flex-col gap-[36px] items-center relative shrink-0">
          {/* Toolbar */}
          <div className="content-stretch flex items-center px-[8px] py-0 relative rounded-[16px] shrink-0 w-full justify-center">
            <div className="content-stretch flex md:flex-row flex-col gap-[10px] items-center justify-center relative shrink-0">
              {/* Color Palette */}
              <div className="bg-white content-stretch flex items-center md:p-[10px] p-[8px] relative rounded-[1000px] shrink-0 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
                <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[1000px]" />
                <div className="content-stretch flex md:gap-[18px] gap-[12px] items-center relative shrink-0">
                  {colors.map((color) => (
                    <ColorButton
                      key={color.id}
                      color={color}
                      isSelected={selectedColor?.id === color.id}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* Toggle Buttons Container */}
              <div className="flex gap-[10px] items-center">
                {/* Date Toggle Button */}
                <div className="bg-white content-stretch flex items-center p-[5px] relative rounded-[1000px] shrink-0 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[1000px]" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDate(!showDate);
                      if (!showDate) {
                        setIsDateFocused(true);
                      }
                    }}
                    className={`relative rounded-[999px] shrink-0 size-[40px] cursor-pointer transition-all duration-300 ${
                      showDate && isDateFocused ? 'bg-[#0088FF]' : showDate ? 'bg-[#bfbfbf] hover:bg-[#a8a8a8]' : 'bg-transparent hover:bg-[#e5e5e5]'
                    }`}
                    aria-label="Toggle date"
                  >
                    <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showDate ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Text Toggle Button */}
                <div className="bg-white content-stretch flex items-center p-[5px] relative rounded-[1000px] shrink-0 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[1000px]" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showText) {
                        setShowText(false);
                        setIsTextFocused(false);
                      } else {
                        setShowText(true);
                        setIsTextFocused(true);
                        setTimeout(() => {
                          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (input) input.focus();
                        }, 100);
                      }
                    }}
                    className={`relative rounded-[999px] shrink-0 size-[40px] cursor-pointer transition-all duration-300 ${
                      showText && isTextFocused ? 'bg-[#0088FF]' : showText ? 'bg-[#bfbfbf] hover:bg-[#a8a8a8]' : 'bg-transparent hover:bg-[#e5e5e5]'
                    }`}
                    aria-label="Toggle text"
                  >
                    <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showText ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 7 4 4 20 4 20 7" />
                        <line x1="9" y1="20" x2="15" y2="20" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="content-stretch flex gap-[24px] items-center relative shrink-0">
            <button 
              className="flex items-center gap-[8px] px-[24px] py-[12px] text-[17px] text-[rgba(60,60,67,0.6)] cursor-pointer rounded-[999px] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
              onClick={handleRestart}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span className="font-['SF_Pro','-apple-system',sans-serif]">Restart</span>
            </button>

            <button 
              className="bg-black rounded-[999px] flex items-center gap-[8px] px-[24px] py-[12px] text-[17px] text-white cursor-pointer hover:bg-[rgba(0,0,0,0.8)] transition-colors"
              onClick={() => setShowShareModal(true)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span className="font-['SF_Pro','-apple-system',sans-serif]">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal Overlay */}
      {showShareModal && (
        <>
          <div 
            className="fixed inset-0 transition-opacity cursor-pointer z-40" 
            style={{ 
              backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)",
              opacity: 0.4
            }}
            onClick={() => setShowShareModal(false)}
          />
          <div className="fixed bg-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[26px] z-50 max-h-[calc(100vh-40px)] max-h-[calc(100dvh-40px)] overflow-y-auto w-[calc(100%-32px)] sm:w-auto sm:min-w-[400px] md:min-w-[530px]">
            <div className="content-stretch flex flex-col gap-[24px] sm:gap-[32px] items-center overflow-clip px-[20px] sm:px-[28px] md:px-[36px] py-[24px] sm:py-[30px] relative rounded-[inherit] w-full sm:min-w-[400px] md:min-w-[530px]">
              <div className="content-stretch flex flex-col gap-[36px] items-center relative shrink-0 w-full">
                <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[22px] text-black tracking-[-0.26px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[28px]">Share Polaroid</p>
                </div>
                
                {/* Mini Polaroid Preview */}
                <div className="relative shrink-0 h-[198px] sm:h-[254.237px] w-[170px] sm:w-[218.074px]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 transition-transform duration-300 ease-out hover:rotate-2 scale-[0.78] sm:scale-100 origin-top" style={{ width: '218.074px', height: '254.237px' }}>
                  <div className="absolute content-stretch flex items-center justify-center left-0 rounded-[4.383px] shadow-[0px_2.192px_13.15px_0px_rgba(0,0,0,0.15)] top-0 w-[218.074px]">
                    <div className="h-[254.237px] relative rounded-[4.383px] shrink-0 w-[218.074px]">
                      <div className="absolute contents left-0 top-0">
                        <div className="absolute contents left-0 top-0">
                          <div 
                            className="absolute blur-[0.162px] filter h-[254.237px] left-0 rounded-[4.383px] top-0 w-[218.074px]"
                            style={{ backgroundColor: selectedColor ? selectedColor.tint : 'white' }}
                          >
                            <div 
                              aria-hidden="true" 
                              className="absolute border-[1.096px] border-solid inset-[-1.096px] pointer-events-none rounded-[5.479px]"
                              style={{ borderColor: selectedColor ? selectedColor.border : 'rgba(0,0,0,0.1)' }}
                            />
                          </div>
                        </div>
                        <div 
                          className="absolute content-stretch flex items-center left-0 pb-[49.313px] pt-[13.15px] px-[13.15px] rounded-[4.383px] top-0"
                          style={{ backgroundColor: selectedColor ? selectedColor.tint : 'white' }}
                        >
                          <div className="relative rounded-[2.192px] shrink-0 size-[191.774px]">
                            <div className="overflow-clip relative rounded-[inherit] size-full">
                              {uploadedImage ? (
                                /* Uploaded image - preserve aspect ratio and center */
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[3.733px] bg-[#f5f5f5]">
                                  <img 
                                    alt="Polaroid photo" 
                                    className="max-w-full max-h-full w-auto h-auto object-contain" 
                                    src={uploadedImage} 
                                  />
                                </div>
                              ) : (
                                /* Default photo - original styling */
                                <div className="absolute h-[191.774px] left-[-23.01px] rounded-[3.733px] top-0 w-[258.809px]">
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[3.733px]">
                                    <img 
                                      alt="Polaroid photo" 
                                      className="absolute h-full left-[-4.86%] max-w-none top-0 w-[109.72%]" 
                                      src={imgDefaultPhoto} 
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div 
                              aria-hidden="true" 
                              className="absolute border-[0.548px] border-solid inset-0 pointer-events-none rounded-[2.192px]"
                              style={{ borderColor: selectedColor ? `${selectedColor.fill}4D` : 'rgba(0,0,0,0.1)' }}
                            />
                          </div>
                        </div>
                        {showDate && (
                          <div 
                            className="absolute flex flex-col justify-center leading-[0] left-[182.78px] not-italic text-[10.959px] text-[rgba(0,0,0,0.4)] text-center text-nowrap top-[239.88px] tracking-[0.15em] -translate-x-1/2 -translate-y-1/2"
                            style={{ fontFamily: "'Courier New', monospace" }}
                          >
                            <p className="leading-[18.629px]">{currentDate}</p>
                          </div>
                        )}
                        {caption && (
                          <div className="absolute content-stretch flex items-center left-[8.07px] px-[5.172px] py-[2.586px] top-[207.15px] w-[104.741px]">
                            <div className="content-stretch flex items-center relative shrink-0">
                              <div 
                                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[12.931px] text-black text-center text-nowrap tracking-[0.15em]"
                                style={{ fontFamily: "'Courier New', monospace" }}
                              >
                                <p className="leading-[21.983px]">{caption}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* Action Buttons */}
                <div className="content-stretch flex gap-[16px] sm:gap-[24px] items-center relative shrink-0 w-full">
                  <button 
                    onClick={handleCopyLink}
                    className="basis-0 bg-white grow h-[120px] sm:h-[140px] min-h-px min-w-px relative rounded-[16px] shrink-0 cursor-pointer hover:bg-gray-50 transition-all duration-300 ease-in-out"
                    style={{ backgroundImage: copyLinkSuccess ? "linear-gradient(90deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.03) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" : undefined }}
                  >
                    <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                    <div className="flex flex-col items-center size-full">
                      <div className="content-stretch flex flex-col gap-[7px] items-center p-[24px] relative size-full">
                        <div className="relative shrink-0 size-[70px]">
                          <div 
                            className={`absolute bg-[#ededed] flex items-center justify-center rounded-full size-[70px] transition-all duration-300 ease-in-out ${
                              copyLinkSuccess ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                            }`}
                          >
                            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </div>
                          <div 
                            className={`absolute bg-[#08f] flex items-center justify-center left-[-2px] rounded-full size-[74px] top-[-2px] transition-all duration-300 ease-in-out ${
                              copyLinkSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                            }`}
                          >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                        <div className="relative h-[20px] overflow-visible">
                          <p 
                            className={`font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] text-[#333] text-[13px] text-center tracking-[-0.1px] transition-all duration-300 ease-in-out ${
                              copyLinkSuccess ? 'opacity-0 translate-y-[-5px]' : 'opacity-100 translate-y-0'
                            }`} 
                            style={{ fontVariationSettings: "'wdth' 100" }}
                          >
                            Copy Link
                          </p>
                          <p 
                            className={`absolute left-0 right-0 top-0 font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] text-[#333] text-[13px] text-center tracking-[-0.1px] transition-all duration-300 ease-in-out ${
                              copyLinkSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[5px]'
                            }`} 
                            style={{ fontVariationSettings: "'wdth' 100" }}
                          >
                            Saved!
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={handleDownload}
                    className="basis-0 bg-white grow h-[120px] sm:h-[140px] min-h-px min-w-px relative rounded-[16px] shrink-0 cursor-pointer hover:bg-gray-50 transition-all duration-300 ease-in-out"
                    style={{ backgroundImage: downloadSuccess ? "linear-gradient(90deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.03) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" : undefined }}
                  >
                    <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
                    <div className="flex flex-col items-center size-full">
                      <div className="content-stretch flex flex-col gap-[7px] items-center p-[24px] relative size-full">
                        <div className="relative shrink-0 size-[70px]">
                          <div 
                            className={`absolute bg-[#ededed] flex items-center justify-center rounded-full size-[70px] transition-all duration-300 ease-in-out ${
                              downloadSuccess ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                            }`}
                          >
                            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </div>
                          <div 
                            className={`absolute bg-[#08f] flex items-center justify-center rounded-full size-[70px] transition-all duration-300 ease-in-out ${
                              downloadSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                            }`}
                          >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </div>
                        <div className="relative h-[15px]">
                          <p 
                            className={`font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] text-[#333] text-[13px] text-center tracking-[-0.1px] transition-all duration-300 ease-in-out ${
                              downloadSuccess ? 'opacity-0 translate-y-[-5px]' : 'opacity-100 translate-y-0'
                            }`} 
                            style={{ fontVariationSettings: "'wdth' 100" }}
                          >
                            Download
                          </p>
                          <p 
                            className={`absolute left-0 right-0 top-0 font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] text-[#333] text-[13px] text-center tracking-[-0.1px] transition-all duration-300 ease-in-out ${
                              downloadSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[5px]'
                            }`} 
                            style={{ fontVariationSettings: "'wdth' 100" }}
                          >
                            Saved!
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute bg-white right-[27px] rounded-full size-[32px] top-[24px] cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(20,20,20,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* App Icon Row */}
              <div className="overflow-x-auto overflow-y-hidden w-[calc(100%+40px)] sm:w-auto md:w-[530px] mx-[-20px] sm:mx-0 scrollbar-hide">
                <div className="content-stretch flex gap-[20px] sm:gap-[28px] items-start justify-start sm:justify-center pb-0 pt-0 px-[20px] sm:px-[4px] relative shrink-0 w-max sm:w-full">
                  <button 
                    onClick={() => handleShareToApp('Instagram')}
                    className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="relative rounded-[18.928px] shrink-0 size-[69.402px]">
                      <img alt="Instagram" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18.928px] size-full" src={imgInstagramIcon} />
                    </div>
                    <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-hidden text-ellipsis relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                      Instagram
                    </p>
                  </button>

                  <button 
                    onClick={() => handleShareToApp('LinkedIn')}
                    className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="relative rounded-[17.35px] shrink-0 size-[69.402px]">
                      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[17.35px]">
                        <img alt="LinkedIn" className="absolute h-[1236.21%] left-[-168.97%] max-w-none top-[-256.03%] w-[568.97%]" src={imgLinkedInIcon} />
                      </div>
                    </div>
                    <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-hidden text-ellipsis relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                      LinkedIn
                    </p>
                  </button>

                  <button 
                    onClick={() => handleShareToApp('Mail')}
                    className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="relative rounded-[15px] shrink-0 size-[70px]">
                      <img alt="Mail" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[15px] size-full" src={imgMailIcon} />
                    </div>
                    <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[13px] overflow-hidden text-ellipsis relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      Mail
                    </p>
                  </button>

                  <button 
                    onClick={() => handleShareToApp('X')}
                    className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="h-[70px] relative rounded-[17.949px] shrink-0 w-[69.402px]">
                      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[17.949px]">
                        <img alt="X" className="absolute h-[1225.64%] left-[-39.66%] max-w-none top-[-671.79%] w-[568.97%]" src={imgXIcon} />
                      </div>
                    </div>
                    <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-hidden text-ellipsis relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                      X
                    </p>
                  </button>

                  <button 
                    onClick={() => handleShareToApp('Messages')}
                    className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px] cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="relative rounded-[18.928px] shrink-0 size-[69.402px]">
                      <img alt="Messages" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18.928px] size-full" src={imgMessagesIcon} />
                    </div>
                    <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-hidden text-ellipsis relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                      Messages
                    </p>
                  </button>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.05)] border-solid inset-0 pointer-events-none rounded-[26px]" />
          </div>
        </>
      )}

      {/* Styles for animations */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInCentered {
          from { 
            opacity: 0; 
            transform: scale(0.9);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-in-out forwards;
        }
        .animate-scale-in-centered {
          animation: scaleInCentered 0.4s ease-in-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

