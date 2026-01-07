import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { domToPng } from 'modern-screenshot';
import imgLogo from '../../assets/logo.png';
import InfoButton from '../InfoButton';

// Project info for the info button modal
const SCREENTIME_PROJECT = {
  id: 'screentime',
  title: 'Screentime Receipt',
  year: '2025',
  description: 'A receipt for your daily or weekly screentime.',
  imageSrc: 'https://image.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI/thumbnail.png',
  videoSrc: 'https://stream.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI.m3u8',
  xLink: 'https://x.com/michelletliu/status/2000987498550383032',
  tryItOutHref: '/screentime',
};

// Import SVG icons
import phoneIconSvg from '../../assets/receipt/Screen Time Receipt/src/assets/􀟜.svg';
import saveIconSvg from '../../assets/receipt/Screen Time Receipt/src/assets/save.svg';
import sendIconSvg from '../../assets/receipt/Screen Time Receipt/src/assets/send.svg';
import savedCheckSvg from './saved.svg';

// Import app icons from the receipt assets folder
import imgInstagramIcon from '../../assets/receipt/Screen Time Receipt/src/assets/fcadb86f9e7ac3194098e501064eb43213cdfff1.png';
import imgTwitterIcon from '../../assets/receipt/Screen Time Receipt/src/assets/a643fce02520f3d992e6b432fa72fab473a1ca7e.png';
import imgLinkedInIcon from '../../assets/receipt/Screen Time Receipt/src/assets/f81f194aee98efdd62a97e659006efa986492874.png';
import imgMessagesIcon from '../../assets/receipt/Screen Time Receipt/src/assets/dd3b1a5ed7db644c197314328f647774bd86226e.png';
import imgCalendarIcon from '../../assets/receipt/Screen Time Receipt/src/assets/d215490446b5a00cb8bffe9167cdce65067a29ac.png';
import imgSlackIcon from '../../assets/receipt/Screen Time Receipt/src/assets/6d01b65a3f6d80963e9f7bc16d4214b718f19e63.png';
import imgNotesIcon from '../../assets/receipt/Screen Time Receipt/src/assets/a96b215a3998f46bd64e605040650bcf6eeedb40.png';
import imgMailIcon from '../../assets/receipt/Screen Time Receipt/src/assets/ed242d6b65d5ccb5cf614e9ecb48eb47cf46d29b.png';
import imgNotionIcon from '../../assets/receipt/Screen Time Receipt/src/assets/7e1b9c12f8851b2eb04dc3a6cde488912f9c1662.png';
import imgYoutubeIcon from '../../assets/receipt/Screen Time Receipt/src/assets/b8fbffbd38baca46478d9cc48b9ea8682aec011f.png';
import imgNetflixIcon from '../../assets/receipt/Screen Time Receipt/src/assets/d05a38e2f2b65e25e0e7c6f7fc308cfd490b8aef.png';
import imgSpotifyIcon from '../../assets/receipt/Screen Time Receipt/src/assets/c5d11845c52c0f03f2dbc26a4acdc83f8e1c322d.png';

const APP_ICONS = {
  instagram: imgInstagramIcon,
  twitter: imgTwitterIcon,
  linkedin: imgLinkedInIcon,
  messages: imgMessagesIcon,
  calendar: imgCalendarIcon,
  slack: imgSlackIcon,
  notes: imgNotesIcon,
  mail: imgMailIcon,
  notion: imgNotionIcon,
  youtube: imgYoutubeIcon,
  netflix: imgNetflixIcon,
  spotify: imgSpotifyIcon,
};

// SVG paths for status bar icons
const svgPaths = {
  cellular: "M19.2 1.14623C19.2 0.513183 18.7224 0 18.1333 0H17.0667C16.4776 0 16 0.513183 16 1.14623V11.0802C16 11.7132 16.4776 12.2264 17.0667 12.2264H18.1333C18.7224 12.2264 19.2 11.7132 19.2 11.0802V1.14623ZM11.7659 2.44528H12.8326C13.4217 2.44528 13.8992 2.97078 13.8992 3.61902V11.0527C13.8992 11.7009 13.4217 12.2264 12.8326 12.2264H11.7659C11.1768 12.2264 10.6992 11.7009 10.6992 11.0527V3.61902C10.6992 2.97078 11.1768 2.44528 11.7659 2.44528ZM7.43411 5.09433H6.36745C5.77834 5.09433 5.30078 5.62652 5.30078 6.28301V11.0377C5.30078 11.6942 5.77834 12.2264 6.36745 12.2264H7.43411C8.02322 12.2264 8.50078 11.6942 8.50078 11.0377V6.28301C8.50078 5.62652 8.02322 5.09433 7.43411 5.09433ZM2.13333 7.53962H1.06667C0.477563 7.53962 0 8.06421 0 8.71132V11.0547C0 11.7018 0.477563 12.2264 1.06667 12.2264H2.13333C2.72244 12.2264 3.2 11.7018 3.2 11.0547V8.71132C3.2 8.06421 2.72244 7.53962 2.13333 7.53962Z",
  wifi: "M8.5713 2.46628C11.0584 2.46639 13.4504 3.38847 15.2529 5.04195C15.3887 5.1696 15.6056 5.16799 15.7393 5.03834L17.0368 3.77487C17.1045 3.70911 17.1422 3.62004 17.1417 3.52735C17.1411 3.43467 17.1023 3.34603 17.0338 3.28104C12.3028 -1.09368 4.83907 -1.09368 0.108056 3.28104C0.039524 3.34598 0.000639766 3.4346 7.82398e-06 3.52728C-0.000624118 3.61996 0.0370483 3.70906 0.104689 3.77487L1.40255 5.03834C1.53615 5.16819 1.75327 5.1698 1.88893 5.04195C3.69167 3.38836 6.08395 2.46628 8.5713 2.46628ZM8.56795 6.68656C9.92527 6.68647 11.2341 7.19821 12.2403 8.12234C12.3763 8.2535 12.5907 8.25065 12.7234 8.11593L14.0106 6.79663C14.0784 6.72742 14.1161 6.63355 14.1151 6.53599C14.1141 6.43844 14.0746 6.34536 14.0054 6.27757C10.9416 3.38672 6.19688 3.38672 3.13305 6.27757C3.06384 6.34536 3.02435 6.43849 3.02345 6.53607C3.02254 6.63365 3.06028 6.72752 3.12822 6.79663L4.41513 8.11593C4.54778 8.25065 4.76215 8.2535 4.89823 8.12234C5.90368 7.19882 7.21152 6.68713 8.56795 6.68656ZM11.0924 9.48011C11.0943 9.58546 11.0572 9.68703 10.9899 9.76084L8.81327 12.2156C8.74946 12.2877 8.66247 12.3283 8.5717 12.3283C8.48093 12.3283 8.39394 12.2877 8.33013 12.2156L6.1531 9.76084C6.08585 9.68697 6.04886 9.58537 6.05085 9.48002C6.05284 9.37467 6.09365 9.27491 6.16364 9.20429C7.55374 7.8904 9.58966 7.8904 10.9798 9.20429C11.0497 9.27497 11.0904 9.37476 11.0924 9.48011Z",
  batteryCap: "M26 4.78113V8.8566C26.8047 8.51143 27.328 7.70847 27.328 6.81886C27.328 5.92926 26.8047 5.1263 26 4.78113",
};

type Screen = 'generate' | 'receipt' | 'share' | 'upload';

type AppUsage = {
  name: string;
  category: string;
  minutes: number;
  icon: string;
};

type ReceiptData = {
  period: 'daily' | 'weekly';
  startDate: string;
  endDate: string;
  generatedTime: string;
  categories: {
    name: string;
    apps: AppUsage[];
  }[];
};

function generateRandomMinutes(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

function generateReceiptData(period: 'daily' | 'weekly'): ReceiptData {
  const now = new Date();
  const endDate = formatDate(now);
  
  let startDate: string;
  if (period === 'weekly') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = formatDate(weekAgo);
  } else {
    startDate = endDate;
  }

  const timeString = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const multiplier = period === 'weekly' ? 7 : 1;

  return {
    period,
    startDate,
    endDate,
    generatedTime: timeString,
    categories: [
      {
        name: "SOCIAL & COMMUNICATION",
        apps: [
          { name: "INSTAGRAM", category: "SOCIAL MEDIA", minutes: generateRandomMinutes(30, 180) * multiplier, icon: APP_ICONS.instagram },
          { name: "TWITTER/X", category: "SOCIAL MEDIA", minutes: generateRandomMinutes(20, 120) * multiplier, icon: APP_ICONS.twitter },
          { name: "LINKEDIN", category: "SOCIAL MEDIA", minutes: generateRandomMinutes(40, 200) * multiplier, icon: APP_ICONS.linkedin },
          { name: "MESSAGES", category: "COMMUNICATION", minutes: generateRandomMinutes(10, 60) * multiplier, icon: APP_ICONS.messages },
        ],
      },
      {
        name: "WORK & PRODUCTIVITY",
        apps: [
          { name: "CALENDAR", category: "PRODUCTIVITY", minutes: generateRandomMinutes(10, 40) * multiplier, icon: APP_ICONS.calendar },
          { name: "SLACK", category: "WORK", minutes: generateRandomMinutes(60, 180) * multiplier, icon: APP_ICONS.slack },
          { name: "NOTES", category: "PRODUCTIVITY", minutes: generateRandomMinutes(5, 30) * multiplier, icon: APP_ICONS.notes },
          { name: "MAIL", category: "WORK", minutes: generateRandomMinutes(30, 90) * multiplier, icon: APP_ICONS.mail },
          { name: "NOTION", category: "PRODUCTIVITY", minutes: generateRandomMinutes(20, 80) * multiplier, icon: APP_ICONS.notion },
        ],
      },
      {
        name: "ENTERTAINMENT",
        apps: [
          { name: "YOUTUBE", category: "ENTERTAINMENT", minutes: generateRandomMinutes(60, 240) * multiplier, icon: APP_ICONS.youtube },
          { name: "NETFLIX", category: "STREAMING", minutes: generateRandomMinutes(30, 150) * multiplier, icon: APP_ICONS.netflix },
          { name: "SPOTIFY", category: "MUSIC", minutes: generateRandomMinutes(60, 300) * multiplier, icon: APP_ICONS.spotify },
        ],
      },
    ],
  };
}

function getRecommendation(totalMinutes: number): { main: string; message: string } {
  const hours = totalMinutes / 60;
  
  if (hours < 2) {
    return { main: "IMPRESSIVE!", message: "You're crushing it! 💪" };
  } else if (hours < 4) {
    return { main: "NICE WORK!", message: "You're doing great! 🌟" };
  } else if (hours < 6) {
    return { main: "NOT BAD!", message: "Pretty good! 👍\nMaybe add a walk to your day?" };
  } else if (hours < 10) {
    return { main: "TIME FOR A BREAK!", message: "Go touch some grass 🌱" };
  } else if (hours < 15) {
    return { main: "SERIOUSLY?!", message: "Your eyes need a rest! 👀" };
  } else if (hours < 20) {
    return { main: "EMERGENCY!", message: "Touch grass IMMEDIATELY 🌱" };
  } else {
    return { main: "ARE YOU OKAY?!", message: "There's a world outside! 🌍" };
  }
}

// Status Bar Component
function StatusBar() {
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  
  return (
    <div className="md:hidden">
      <div className="absolute bg-gradient-to-b from-[#f3f4f6] from-[32.87%] h-[108px] left-1/2 to-transparent top-0 -translate-x-1/2 w-[402px] max-w-full" />
      <div className="absolute flex gap-[154px] items-center justify-center left-1/2 pb-[19px] pt-[21px] px-[16px] top-0 -translate-x-1/2 w-[402px] max-w-full">
        <div className="basis-0 flex grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
          <p className="font-mono font-semibold leading-[22px] relative shrink-0 text-[17px] text-black text-center text-nowrap">
            {currentTime}
          </p>
        </div>
        <div className="basis-0 flex gap-[7px] grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-px px-0 relative shrink-0">
          <div className="relative shrink-0 h-[12.226px] w-[19.2px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 12.2264">
              <path clipRule="evenodd" d={svgPaths.cellular} fill="black" fillRule="evenodd" />
            </svg>
          </div>
          <div className="relative shrink-0 h-[12.328px] w-[17.142px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1417 12.3283">
              <path clipRule="evenodd" d={svgPaths.wifi} fill="black" fillRule="evenodd" />
            </svg>
          </div>
          <div className="h-[13px] relative shrink-0 w-[27.328px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.328 13">
              <rect height="12" opacity="0.35" rx="3.8" stroke="black" width="24" x="0.5" y="0.5" />
              <path d={svgPaths.batteryCap} fill="black" opacity="0.4" />
              <rect fill="black" height="9" rx="2.5" width="21" x="2" y="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Home Indicator Component
function HomeIndicator({ additionalClassNames = "" }: { additionalClassNames?: string }) {
  return (
    <div className={`md:hidden absolute h-[34px] left-1/2 -translate-x-1/2 w-[400px] max-w-full ${additionalClassNames}`}>
      <div className="absolute bottom-[8px] flex h-[5px] items-center justify-center left-1/2 -translate-x-1/2 w-[144px]">
        <div className="flex-none rotate-180 scale-y-[-1]">
          <div className="bg-black h-[5px] rounded-[100px] w-[144px]" />
        </div>
      </div>
    </div>
  );
}

// Generate Screen Component
function GenerateScreen({ 
  period, 
  onPeriodChange, 
  onGenerate, 
  onUploadClick 
}: { 
  period: 'daily' | 'weekly'; 
  onPeriodChange: (period: 'daily' | 'weekly') => void; 
  onGenerate: () => void;
  onUploadClick: () => void;
}) {
  return (
    <div className="absolute bg-white flex flex-col gap-[24px] items-center left-1/2 px-[48px] py-[32px] rounded-[26px] shadow-[0px_2px_8px_rgba(0,0,0,0.1)] top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[90%]">
      <div className="bg-[rgba(116,116,128,0.08)] flex flex-col items-center justify-center p-[10px] relative rounded-full shrink-0 size-[120px]">
        <img src={phoneIconSvg} alt="Phone" className="w-[38px] h-[63px]" />
      </div>
      <div className="font-mono leading-[28px] relative shrink-0 text-[22px] text-black text-center text-nowrap">
        <p className="mb-0">SCREEN TIME</p>
        <p>RECEIPT</p>
      </div>
      <div className="flex items-start relative shrink-0">
        <div className="bg-[rgba(118,118,128,0.12)] flex h-[36px] items-center justify-center overflow-clip px-[8px] py-[4px] relative rounded-[100px] shrink-0 w-[209px]">
          <button
            onClick={() => onPeriodChange('daily')}
            className="basis-0 grow h-full min-h-px min-w-px relative rounded-[7px] shrink-0 cursor-pointer"
          >
            <div className="flex flex-row items-center size-full">
              <div className="flex items-center px-[10px] py-[2px] relative size-full">
                {period === 'daily' && (
                  <div className="absolute bg-white inset-[0_-4.5px_0_-4px] rounded-[20px] shadow-[0px_2px_20px_rgba(0,0,0,0.06)]" />
                )}
                <p className={`basis-0 font-mono ${period === 'daily' ? 'font-semibold' : 'font-medium'} grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap tracking-[-0.08px]`}>
                  Daily
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => onPeriodChange('weekly')}
            className="basis-0 grow h-full min-h-px min-w-px relative shrink-0 cursor-pointer"
          >
            <div className="flex flex-row items-center size-full">
              <div className="flex items-center px-[10px] py-[3px] relative size-full">
                {period === 'weekly' && (
                  <div className="absolute bg-white inset-[0_-4.5px_0_-4px] rounded-[20px] shadow-[0px_2px_20px_rgba(0,0,0,0.06)]" />
                )}
                <p className={`basis-0 font-mono ${period === 'weekly' ? 'font-semibold' : 'font-medium'} grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap`}>
                  Weekly
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
      <button
        onClick={onGenerate}
        className="bg-[#404040] flex items-center justify-center px-6 py-[10px] relative rounded-full shrink-0 cursor-pointer hover:bg-[#333] transition-colors w-full"
      >
        <p className="font-mono leading-normal relative shrink-0 text-[15px] text-center text-nowrap text-white tracking-[0.75px]">GENERATE</p>
      </button>

      </div>
    </div>
  );
}

// App Icon Component
function AppIcon({ appName, icon }: { appName: string; icon: string }) {
  const baseStyles = "relative shrink-0 size-[44px]";
  
  switch (appName) {
    case "INSTAGRAM":
      return (
        <div className={`${baseStyles} rounded-[12px]`}>
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[12px] size-full" src={icon} />
        </div>
      );
    case "TWITTER/X":
      return (
        <div className="h-[44.379px] relative rounded-[11.379px] shrink-0 w-[44px] overflow-hidden">
          <img alt="" className="absolute h-[1225.64%] left-[-39.66%] max-w-none top-[-671.79%] w-[568.97%]" src={icon} />
        </div>
      );
    case "LINKEDIN":
      return (
        <div className={`${baseStyles} rounded-[11px] overflow-hidden`}>
          <img alt="" className="absolute h-[1236.21%] left-[-168.97%] max-w-none top-[-256.03%] w-[568.97%]" src={icon} />
        </div>
      );
    case "MESSAGES":
      return (
        <div className={baseStyles}>
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
    case "CALENDAR":
      return (
        <div className={`${baseStyles} rounded-[10.891px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)] overflow-hidden`}>
          <img alt="" className="absolute h-[1419.8%] left-[-500.99%] max-w-none top-[-301.98%] w-[653.47%]" src={icon} />
        </div>
      );
    case "SLACK":
      return (
        <div className="h-[44px] relative rounded-[11.759px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)] shrink-0 w-[44.379px] overflow-hidden">
          <img alt="" className="absolute h-[1236.21%] left-[-167.52%] max-w-none top-[-115.52%] w-[564.1%]" src={icon} />
        </div>
      );
    case "NOTES":
      return (
        <div className={baseStyles}>
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
    case "MAIL":
      return (
        <div className="h-[44px] relative shrink-0 w-[44.25px] overflow-hidden">
          <img alt="" className="absolute h-[814.77%] left-[-16.95%] max-w-none top-[-107.95%] w-[372.88%]" src={icon} />
        </div>
      );
    case "NOTION":
      return (
        <div className={`${baseStyles} rounded-[11.327px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)] overflow-hidden`}>
          <img alt="" className="absolute h-[1419.8%] left-[-351.49%] max-w-none top-[-301.98%] w-[653.47%]" src={icon} />
        </div>
      );
    case "YOUTUBE":
      return (
        <div className="h-[44px] relative rounded-[11.658px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)] shrink-0 w-[43.624px] overflow-hidden">
          <img alt="" className="absolute h-[1225.64%] left-[-300%] max-w-none top-[-811.11%] w-[568.97%]" src={icon} />
        </div>
      );
    case "NETFLIX":
      return (
        <div className="h-[43.254px] relative rounded-[11.186px] shrink-0 w-[44px] overflow-hidden">
          <img alt="" className="absolute h-[1236.21%] left-[-422.03%] max-w-none top-[-818.1%] w-[559.32%]" src={icon} />
        </div>
      );
    case "SPOTIFY":
      return (
        <div className="h-[43.254px] relative rounded-[10.814px] shrink-0 w-[44px] overflow-hidden">
          <img alt="" className="absolute h-[1236.21%] left-[-294.07%] max-w-none top-[-115.52%] w-[559.32%]" src={icon} />
        </div>
      );
    default:
      return (
        <div className={`${baseStyles} rounded-[12px] overflow-hidden`}>
          <img alt="" className="max-w-none object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
  }
}

// Receipt Screen Component
function ReceiptScreen({ 
  data, 
  onSave, 
  onShare, 
  onGenerateNew 
}: { 
  data: ReceiptData; 
  onSave: () => void; 
  onShare: () => void; 
  onGenerateNew: () => void;
}) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const grandTotal = data.categories.reduce((sum, cat) => 
    sum + cat.apps.reduce((appSum, app) => appSum + app.minutes, 0), 0
  );

  const handleSave = async () => {
    if (!receiptRef.current || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // Capture the receipt as PNG
      const dataUrl = await domToPng(receiptRef.current, {
        scale: 3, // Higher resolution
        backgroundColor: '#ffffff',
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: '2-digit'
      }).replace(/\//g, '.');
      link.download = `ScreenTimeReceipt_${dateStr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save receipt:', error);
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    // Use native Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Screen Time Receipt',
          text: `Check out my ${data.period === 'weekly' ? 'weekly' : 'daily'} screen time receipt!`,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        // User cancelled - don't show success
        console.log('Share cancelled:', err);
      }
    } else {
      // Fallback for browsers without Web Share API
      onShare();
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const recommendation = getRecommendation(grandTotal);

  return (
    <div className="absolute flex flex-col gap-[24px] items-center left-1/2 top-[86px] md:top-[40px] -translate-x-1/2 w-[337px] max-w-[90%] pb-[100px] animate-slide-in transition-transform duration-400">
      <div ref={receiptRef} className="bg-white relative shadow-md shrink-0 w-full border border-gray-200">
        <div className="flex flex-col items-center size-full">
          <div className="flex flex-col gap-[32px] items-center px-[24px] py-[32px] relative w-full">
            <div className="flex flex-col gap-[24px] items-center relative shrink-0 w-full">
              <div className="flex flex-col font-mono gap-[4px] items-center relative shrink-0 text-center w-[201px] max-w-full">
                <p className="leading-[22px] min-w-full relative shrink-0 text-[17px] text-black font-semibold">DIGITAL RECEIPT</p>
                <p className="leading-[22px] relative shrink-0 text-[13px] text-gray-400 text-nowrap">
                  {data.period === 'weekly' ? 'Weekly' : 'Daily'} Screen Time Summary
                </p>
                <div className="leading-[22px] relative shrink-0 text-[13px] text-gray-500 text-nowrap">
                  <p className="mb-0">{data.startDate} - {data.endDate}</p>
                  <p>Generated {data.generatedTime}</p>
                </div>
              </div>
            </div>

            {data.categories.map((category, idx) => {
              const subtotal = category.apps.reduce((sum, app) => sum + app.minutes, 0);
              
              return (
                <div key={idx} className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                  {/* Category Header */}
                  <div className="flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                    <p className="font-mono leading-[22px] font-semibold relative shrink-0 text-[13px] text-black w-full">{category.name}</p>
                    <div className="h-0 relative shrink-0 w-full">
                      <div className="absolute inset-[-1px_0_0_0]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                          <line stroke="gray" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Apps List */}
                  {category.apps.map((app, appIdx) => (
                    <div key={appIdx} className="flex gap-[16px] items-center relative shrink-0 w-full">
                      <AppIcon appName={app.name} icon={app.icon} />
                      <div className="basis-0 flex font-mono grow items-start justify-between leading-[22px] min-h-px min-w-px relative shrink-0 text-[13px]">
                        <div className="flex flex-col items-start relative shrink-0 w-[97px]">
                          <p className="min-w-full relative shrink-0 text-black font-semibold">{app.name}</p>
                          <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{app.category}</p>
                        </div>
                        <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap font-semibold">{formatTime(app.minutes)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Subtotal */}
                  <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="h-0 relative shrink-0 w-full">
                      <div className="absolute inset-[-1px_0_0_0]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                          <line stroke="black" strokeDasharray="2 2" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex font-mono items-start justify-between leading-[22px] relative shrink-0 text-[13px] w-full font-semibold">
                      <p className="relative self-stretch shrink-0 text-[rgba(0,0,0,0.5)] w-[97px]">SUBTOTAL:</p>
                      <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{formatTime(subtotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Grand Total & Recommendation */}
            <div className="flex flex-col gap-[24px] items-center relative shrink-0 w-full">
              <div className="flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                {/* Divider */}
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                      <line stroke="black" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex font-mono items-start justify-between leading-[22px] relative shrink-0 text-[17px] text-nowrap w-full font-semibold">
                  <p className="relative shrink-0 text-black">GRAND TOTAL:</p>
                  <p className="relative shrink-0 text-[rgba(0,0,0,0.8)] text-center">{formatTime(grandTotal)}</p>
                </div>
                {/* Divider */}
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                      <line stroke="black" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col font-mono gap-[16px] items-start relative shrink-0 text-center w-full ">
                <p className="leading-[22px] relative shrink-0 text-[17px] font-semibold text-[rgba(0,0,0,0.6)] w-full">{recommendation.main}</p>
                <div className="leading-[22px] relative shrink-0 text-[15px] text-[rgba(0,0,0,0.4)] font-medium w-full whitespace-pre-line">
                  <p className="mb-0">Recommendation:</p>
                  <p>{recommendation.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-[24px] items-center justify-center px-0 py-[16px] relative shrink-0 w-full">
        <button onClick={handleSave} disabled={isSaving} className="flex flex-col items-start relative shrink-0 cursor-pointer group disabled:cursor-default">
          <div className="flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]">
            <div className={`flex items-center justify-center relative rounded-full shrink-0 size-[70px] transition-colors ${
              saveSuccess ? 'bg-[#08f]' : isSaving ? 'bg-[#ededed]' : 'bg-[#ededed] group-hover:bg-[#e0e0e0]'
            }`}>
              {isSaving ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              ) : saveSuccess ? (
                <img src={savedCheckSvg} alt="Saved" className="w-[22px] h-[21px]" />
              ) : (
                <img src={saveIconSvg} alt="Save" className="w-[22px] h-[27px]" />
              )}
            </div>
            <p className="font-mono font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]">
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save'}
            </p>
          </div>
        </button>
        <button onClick={handleShare} className="flex flex-col items-start relative shrink-0 cursor-pointer group">
          <div className="flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]">
            <div className={`flex items-center justify-center relative rounded-full shrink-0 size-[70px] transition-colors ${
              shareSuccess ? 'bg-[#08f]' : 'bg-[#ededed] group-hover:bg-[#e0e0e0]'
            }`}>
              {shareSuccess ? (
                <img src={savedCheckSvg} alt="Shared" className="w-[22px] h-[21px]" />
              ) : (
                <img src={sendIconSvg} alt="Share" className="w-[26px] h-[26px]" />
              )}
            </div>
            <p className="font-mono font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]">
              {shareSuccess ? 'Shared' : 'Share'}
            </p>
          </div>
        </button>
      </div>
      
      {/* Generate New Button */}
      <button onClick={onGenerateNew} className="h-[22px] relative shrink-0 w-[204px] cursor-pointer">
        <p className="absolute font-mono inset-0 leading-[22px] text-[15px] text-[rgba(0,0,0,0.5)] text-center text-nowrap hover:text-[rgba(0,0,0,0.7)] transition-colors font-semibold">← Generate New Receipt</p>
      </button>
    </div>
  );
}

// Share Sheet Component
function ShareSheet({ onClose }: { onClose: () => void }) {
  const contacts = [
    { name: "Ashley", emoji: "👩" },
    { name: "Jordan", emoji: "👨" },
    { name: "Gary and Tasha", emoji: "👫" },
    { name: "Steven", emoji: "🧑" },
  ];

  const shareApps = [
    { name: "AirDrop", icon: "📱", color: "bg-blue-500" },
    { name: "Messages", icon: "💬", color: "bg-green-500" },
    { name: "Mail", icon: "📧", color: "bg-blue-400" },
    { name: "Notes", icon: "📝", color: "bg-yellow-300" },
  ];

  const actions = [
    { name: "Copy", icon: "📋" },
    { name: "Add to Favorites", icon: "⭐" },
    { name: "Add to Reading List", icon: "👓" },
    { name: "Add Bookmark", icon: "📖" },
  ];

  const handleAction = (actionName: string) => {
    alert(`${actionName} clicked! (This is a demo)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[20px] w-full max-w-[402px] pb-8 animate-slide-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center px-8 py-3 border-b border-gray-200">
          <h3 className="font-mono text-[15px] font-semibold">Screen Time Receipt</h3>
        </div>
        
        <p className="text-center text-[13px] text-gray-400 font-mono py-2">Weekly Time Summary</p>
        
        <div className="px-8 py-3">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {contacts.map((contact, idx) => (
              <button key={idx} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-3xl">
                  {contact.emoji}
                </div>
                <span className="text-[11px] text-gray-700 font-mono truncate w-full text-center">
                  {contact.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 py-3 border-t border-gray-200">
          <div className="flex gap-4 justify-around">
            {shareApps.map((app, idx) => (
              <button key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-[60px] h-[60px] rounded-[15px] ${app.color} flex items-center justify-center text-3xl shadow-sm`}>
                  {app.icon}
                </div>
                <span className="text-[11px] text-gray-700 font-mono">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 py-3 border-t border-gray-200 space-y-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              className="flex items-center gap-3 w-full py-3 px-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => handleAction(action.name)}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-[15px] text-gray-900 font-mono">
                {action.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Upload Instructions Component
function UploadInstructions({ onClose, onUploadSuccess }: { onClose: () => void; onUploadSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please upload a file under 10MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    // Actually load and validate the image
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Check if image dimensions look like a phone screenshot (portrait, reasonable size)
        const isPortrait = img.height > img.width;
        const hasReasonableSize = img.width >= 300 && img.height >= 400;
        
        if (!isPortrait) {
          setIsProcessing(false);
          setError('Please upload a portrait screenshot from your phone\'s Screen Time settings.');
          return;
        }
        
        if (!hasReasonableSize) {
          setIsProcessing(false);
          setError('Image is too small. Please upload a full-resolution screenshot.');
          return;
        }

        // Image is valid - generate receipt
        setTimeout(() => {
          setIsProcessing(false);
          onUploadSuccess();
        }, 500);
      };
      
      img.onerror = () => {
        setIsProcessing(false);
        setError('Could not read the image. Please try a different file.');
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      setIsProcessing(false);
      setError('Could not read the file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] py-2 pb-4 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0px_4px_20px_rgba(0,0,0,0.2)] animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="top-0 bg-white flex items-center justify-center px-12 pt-8 rounded-t-[20px]">
          <h2 className="font-mono text-lg text-black font-semibold">Upload Your Screen Time Data</h2>
        </div>
        
        <div className="px-12 py-6 space-y-6 font-mono text-[15px]">
        <div className="border-t border-gray-200" />
          <div className="space-y-3">
            <h3 className="font-['Figtree'] text-base text-black font-semibold">iPhone</h3>
            <ol className="font-['Figtree'] space-y-3 pl-10 list-decimal text-gray-500 leading-normal">
              <li>Open the <strong>Settings</strong> app</li>
              <li>Scroll down and tap <strong>Screen Time</strong></li>
              <li>Tap <strong>See All Activity</strong></li>
              <li>Choose <strong>Week</strong> or <strong>Day</strong> at the top</li>
              <li>Take a screenshot (Press Side Button + Volume Up)</li>
            </ol>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3">
            <h3 className="font-mono text-base text-black font-semibold">Android</h3>
            <ol className="font-['Figtree'] space-y-3 pl-10 list-decimal text-gray-500 leading-normal">
              <li>Open the <strong>Settings</strong> app</li>
              <li>Tap <strong>Digital Wellbeing & parental controls</strong></li>
              <li>Tap the graph to see your screen time details</li>
              <li>Take a screenshot (usually Power + Volume Down)</li>
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-['Figtree'] text-sm text-red-800 font-medium">Upload failed</p>
                <p className="font-['Figtree'] text-sm text-red-600 mt-0.5">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <label className="block">
            <div className={`${isProcessing ? 'bg-gray-400' : 'bg-[#404040] hover:bg-[#333]'} transition-colors flex items-center justify-center px-[20px] py-[12px] rounded-full cursor-pointer`}>
              <p className="font-mono text-[15px] text-center text-white tracking-[0.75px]">
                {isProcessing ? 'PROCESSING...' : 'UPLOAD SCREENSHOT'}
              </p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={isProcessing}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// Main Screentime Page Component
export default function ScreentimePage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('generate');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation back to home
  const handleBackToHome = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/');
    }, 280);
  };

  const handleGenerate = () => {
    const data = generateReceiptData(period);
    setReceiptData(data);
    setScreen('receipt');
  };

  const handleSave = () => {
    alert('Receipt saved! (This is a demo - in a real app, this would save to your device)');
  };

  const handleShare = async () => {
    // Use the native Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Screen Time Receipt',
          text: `Check out my ${period === 'weekly' ? 'weekly' : 'daily'} screen time receipt!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed - that's okay
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setScreen('share');
    }
  };

  const handleCloseShare = () => {
    setScreen('receipt');
  };

  const handleGenerateNew = () => {
    setScreen('generate');
    setReceiptData(null);
  };

  const handleUpload = () => {
    setScreen('upload');
  };

  const handleCloseUpload = () => {
    setScreen('generate');
  };

  const handleUploadSuccess = () => {
    // Generate receipt with the uploaded data (using sample data for demo)
    const data = generateReceiptData(period);
    setReceiptData(data);
    setScreen('receipt');
  };

  return (
    <>
      {/* Logo - fixed outside transitioning container */}
      <button
        onClick={handleBackToHome}
        className="fixed top-8 left-8 md:left-16 z-40 cursor-pointer transition-opacity duration-200 hover:opacity-80"
        aria-label="Go back to home"
      >
        <img 
          src={imgLogo} 
          alt="Michelle Liu Logo" 
          className="w-[44px] h-[44px] object-contain"
        />
      </button>

      {/* Info Button - fixed top right */}
      <InfoButton project={SCREENTIME_PROJECT} />

      <div 
        className={`screentime-page-container relative w-full min-h-screen min-h-[100dvh] px-4 flex flex-col items-center transition-all ${
          isExiting ? 'opacity-0 scale-[0.985]' : isEntering ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
        }`}
        style={{ 
          backgroundColor: '#f3f4f6',
          transitionDuration: isExiting ? '280ms' : '300ms',
          transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease-out'
        }}
      >
        <div className="relative w-full max-w-[402px] min-h-screen mx-auto bg-[#f3f4f6]">
          {/* Hide status bar on mobile - users already have their real one */}
          <div className="hidden md:block">
            <StatusBar />
          </div>
          <HomeIndicator additionalClassNames="bottom-0" />
          
          {screen === 'generate' && (
            <GenerateScreen 
              period={period}
              onPeriodChange={setPeriod}
              onGenerate={handleGenerate}
              onUploadClick={handleUpload}
            />
          )}
          
          {screen === 'receipt' && receiptData && (
            <ReceiptScreen 
              data={receiptData}
              onSave={handleSave}
              onShare={handleShare}
              onGenerateNew={handleGenerateNew}
            />
          )}
          
          {screen === 'share' && (
            <ShareSheet onClose={handleCloseShare} />
          )}
          
          {screen === 'upload' && (
            <UploadInstructions onClose={handleCloseUpload} onUploadSuccess={handleUploadSuccess} />
          )}
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        .screentime-page-container {
          overflow-y: auto;
        }
        
        .screentime-page-container,
        .screentime-page-container * {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slide-in {
          animation: slideInFromBottom 0.5s ease-out;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
