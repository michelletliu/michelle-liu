import { useState, useEffect } from "react";
import imgInstagramIcon11 from "figma:asset/fcadb86f9e7ac3194098e501064eb43213cdfff1.png";
import imgImg6929 from "figma:asset/a643fce02520f3d992e6b432fa72fab473a1ca7e.png";
import imgImg6930 from "figma:asset/f81f194aee98efdd62a97e659006efa986492874.png";
import imgSystemIcons from "figma:asset/dd3b1a5ed7db644c197314328f647774bd86226e.png";
import imgImg6926 from "figma:asset/d215490446b5a00cb8bffe9167cdce65067a29ac.png";
import imgImg6919 from "figma:asset/6d01b65a3f6d80963e9f7bc16d4214b718f19e63.png";
import imgSystemIcons1 from "figma:asset/a96b215a3998f46bd64e605040650bcf6eeedb40.png";
import imgImg6921 from "figma:asset/ed242d6b65d5ccb5cf614e9ecb48eb47cf46d29b.png";
import imgImg6925 from "figma:asset/7e1b9c12f8851b2eb04dc3a6cde488912f9c1662.png";
import imgImg6932 from "figma:asset/b8fbffbd38baca46478d9cc48b9ea8682aec011f.png";
import imgImg69331 from "figma:asset/d05a38e2f2b65e25e0e7c6f7fc308cfd490b8aef.png";
import imgImg6931 from "figma:asset/c5d11845c52c0f03f2dbc26a4acdc83f8e1c322d.png";

export type AppUsage = {
  name: string;
  category: string;
  minutes: number;
  icon: string;
  iconStyle?: string;
};

export type ReceiptData = {
  period: 'daily' | 'weekly';
  startDate: string;
  endDate: string;
  generatedTime: string;
  categories: {
    name: string;
    apps: AppUsage[];
  }[];
};

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-0 relative shrink-0 w-full">
      <div className="absolute inset-[-1px_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
          {children}
        </svg>
      </div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <p className="font-['SF_Mono:Semibold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[13px] text-black w-full">{children}</p>
      <Wrapper>
        <line id="Line 1" stroke="var(--stroke-0, black)" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
      </Wrapper>
    </div>
  );
}

function Helper2() {
  return (
    <Wrapper>
      <line id="Line 1" stroke="var(--stroke-0, black)" strokeDasharray="2 2" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
    </Wrapper>
  );
}

function Frame20Helper() {
  return (
    <Wrapper>
      <line id="Line 1" stroke="var(--stroke-0, black)" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
    </Wrapper>
  );
}

type HelperProps = {
  text: string;
  text1: string;
};

function Helper({ text, text1 }: HelperProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[97px]">
      <p className="min-w-full relative shrink-0 text-black w-[min-content]">{text}</p>
      <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{text1}</p>
    </div>
  );
}

type Helper1Props = {
  text: string;
  text1: string;
};

function Helper1({ text, text1 }: Helper1Props) {
  return (
    <div className="content-stretch flex font-['SF_Mono:Semibold',sans-serif] items-start justify-between leading-[22px] not-italic relative shrink-0 text-[13px] w-full">
      <p className="relative self-stretch shrink-0 text-[rgba(0,0,0,0.5)] w-[97px]">{text}</p>
      <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{text1}</p>
    </div>
  );
}

type SymbolTextProps = {
  text: string;
};

function SymbolText({ text }: SymbolTextProps) {
  return (
    <div className="bg-[#ededed] content-stretch flex flex-col items-center justify-center relative rounded-[1000px] shrink-0 size-[70px]">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 size-[70px] text-[#333] text-[25px] text-center tracking-[0.06px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13px]">{text}</p>
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

type ReceiptScreenProps = {
  data: ReceiptData;
  onSave: () => void;
  onShare: () => void;
  onGenerateNew: () => void;
};

export function ReceiptScreen({ data, onSave, onShare, onGenerateNew }: ReceiptScreenProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const grandTotal = data.categories.reduce((sum, cat) => 
    sum + cat.apps.reduce((appSum, app) => appSum + app.minutes, 0), 0
  );

  const handleSave = () => {
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleShare = () => {
    onShare();
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const getRecommendation = (totalMinutes: number): { main: string; message: string } => {
    const hours = totalMinutes / 60;
    
    if (hours < 2) {
      return {
        main: "IMPRESSIVE!",
        message: "You're crushing it! 💪\nKeep up the healthy balance!"
      };
    } else if (hours < 4) {
      return {
        main: "NICE WORK!",
        message: "You're doing great! 🌟\nYour screen time is well-balanced."
      };
    } else if (hours < 6) {
      return {
        main: "NOT BAD!",
        message: "Pretty good! 👍\nMaybe add a walk to your day?"
      };
    } else if (hours < 10) {
      return {
        main: "TIME FOR A BREAK!",
        message: "That's a lot of screen time! 😅\nGo touch some grass 🌱"
      };
    } else if (hours < 15) {
      return {
        main: "SERIOUSLY?!",
        message: "Your eyes need a rest! 👀\nPlease step outside!"
      };
    } else if (hours < 20) {
      return {
        main: "EMERGENCY!",
        message: "This is unhealthy! ⚠️\nTouch grass IMMEDIATELY 🌱"
      };
    } else {
      return {
        main: "ARE YOU OKAY?!",
        message: "There's a world outside! 🌍\nSeriously, please go outside!"
      };
    }
  };

  const recommendation = getRecommendation(grandTotal);

  const getIconStyle = (appName: string) => {
    // Return exact Figma styling for each app icon
    switch (appName) {
      case "INSTAGRAM":
        return (
          <div className="relative rounded-[12px] shrink-0 size-[44px]">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={APP_ICONS.instagram} />
          </div>
        );
      case "TWITTER/X":
        return (
          <div className="h-[44.379px] relative rounded-[11.379px] shrink-0 w-[44px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.379px]">
              <img alt="" className="absolute h-[1225.64%] left-[-39.66%] max-w-none top-[-671.79%] w-[568.97%]" src={APP_ICONS.twitter} />
            </div>
          </div>
        );
      case "LINKEDIN":
        return (
          <div className="relative rounded-[11px] shrink-0 size-[44px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11px]">
              <img alt="" className="absolute h-[1236.21%] left-[-168.97%] max-w-none top-[-256.03%] w-[568.97%]" src={APP_ICONS.linkedin} />
            </div>
          </div>
        );
      case "MESSAGES":
        return (
          <div className="relative shrink-0 size-[44px]">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={APP_ICONS.messages} />
          </div>
        );
      case "CALENDAR":
        return (
          <div className="relative rounded-[10.891px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 size-[44px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10.891px]">
              <img alt="" className="absolute h-[1419.8%] left-[-500.99%] max-w-none top-[-301.98%] w-[653.47%]" src={APP_ICONS.calendar} />
            </div>
          </div>
        );
      case "SLACK":
        return (
          <div className="h-[44px] relative rounded-[11.759px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-[44.379px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.759px]">
              <img alt="" className="absolute h-[1236.21%] left-[-167.52%] max-w-none top-[-115.52%] w-[564.1%]" src={APP_ICONS.slack} />
            </div>
          </div>
        );
      case "NOTES":
        return (
          <div className="relative shrink-0 size-[44px]">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={APP_ICONS.notes} />
          </div>
        );
      case "MAIL":
        return (
          <div className="h-[44px] relative shrink-0 w-[44.25px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute h-[814.77%] left-[-16.95%] max-w-none top-[-107.95%] w-[372.88%]" src={APP_ICONS.mail} />
            </div>
          </div>
        );
      case "NOTION":
        return (
          <div className="relative rounded-[11.327px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 size-[44px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.327px]">
              <img alt="" className="absolute h-[1419.8%] left-[-351.49%] max-w-none top-[-301.98%] w-[653.47%]" src={APP_ICONS.notion} />
            </div>
          </div>
        );
      case "YOUTUBE":
        return (
          <div className="h-[44px] relative rounded-[11.658px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-[43.624px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.658px]">
              <img alt="" className="absolute h-[1225.64%] left-[-300%] max-w-none top-[-811.11%] w-[568.97%]" src={APP_ICONS.youtube} />
            </div>
          </div>
        );
      case "NETFLIX":
        return (
          <div className="h-[43.254px] relative rounded-[11.186px] shrink-0 w-[44px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.186px]">
              <img alt="" className="absolute h-[1236.21%] left-[-422.03%] max-w-none top-[-818.1%] w-[559.32%]" src={APP_ICONS.netflix} />
            </div>
          </div>
        );
      case "SPOTIFY":
        return (
          <div className="h-[43.254px] relative rounded-[10.814px] shrink-0 w-[44px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10.814px]">
              <img alt="" className="absolute h-[1236.21%] left-[-294.07%] max-w-none top-[-115.52%] w-[559.32%]" src={APP_ICONS.spotify} />
            </div>
          </div>
        );
      default:
        return (
          <div className="relative rounded-[12px] shrink-0 size-[44px] overflow-hidden">
            <img alt="" className="max-w-none object-cover pointer-events-none size-full" src={APP_ICONS.instagram} />
          </div>
        );
    }
  };

  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-1/2 top-[86px] md:top-[40px] translate-x-[-50%] w-[337px] max-w-[90%] pb-[100px] animate-in slide-in-from-bottom">
      <div className="bg-white relative shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)] shrink-0 w-full">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col gap-[32px] items-center px-[24px] py-[32px] relative w-full">
            <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
              <div className="content-stretch flex flex-col font-['SF_Mono:Semibold',sans-serif] gap-[4px] items-center not-italic relative shrink-0 text-center w-[201px] max-w-full">
                <p className="leading-[22px] min-w-full relative shrink-0 text-[17px] text-black w-[min-content]">DIGITAL RECEIPT</p>
                <p className="leading-[22px] relative shrink-0 text-[13px] text-[rgba(0,0,0,0.5)] text-nowrap">
                  {data.period === 'weekly' ? 'Weekly' : 'Daily'} Screen Time Summary
                </p>
                <div className="leading-[22px] relative shrink-0 text-[13px] text-[rgba(0,0,0,0.8)] text-nowrap">
                  <p className="mb-0">{data.startDate} - {data.endDate}</p>
                  <p>Generated {data.generatedTime}</p>
                </div>
              </div>
            </div>

            {data.categories.map((category, idx) => {
              const subtotal = category.apps.reduce((sum, app) => sum + app.minutes, 0);
              
              return (
                <div key={idx} className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                  <Wrapper1>{category.name}</Wrapper1>
                  
                  {category.apps.map((app, appIdx) => (
                    <div key={appIdx} className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                      {getIconStyle(app.name)}
                      <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                        <Helper text={app.name} text1={app.category} />
                        <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{formatTime(app.minutes)}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <Helper2 />
                    <Helper1 text="SUBTOTAL:" text1={formatTime(subtotal)} />
                  </div>
                </div>
              );
            })}

            <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <Frame20Helper />
                <div className="content-stretch flex font-['SF_Mono:Semibold',sans-serif] items-start justify-between leading-[22px] not-italic relative shrink-0 text-[17px] text-nowrap w-full">
                  <p className="relative shrink-0 text-black">GRAND TOTAL:</p>
                  <p className="relative shrink-0 text-[rgba(0,0,0,0.8)] text-center">{formatTime(grandTotal)}</p>
                </div>
                <Frame20Helper />
              </div>
              <div className="content-stretch flex flex-col font-['SF_Mono:Semibold',sans-serif] gap-[16px] items-start not-italic relative shrink-0 text-center w-full">
                <p className="leading-[22px] relative shrink-0 text-[17px] text-gray-500 w-full">{recommendation.main}</p>
                <div className="leading-[22px] relative shrink-0 text-[15px] text-[rgba(0,0,0,0.4)] w-full">
                  <p className="mb-0">Recommendation:</p>
                  <p>{recommendation.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="content-stretch flex gap-[24px] items-center justify-center px-0 py-[16px] relative shrink-0 w-full" data-name="Actions (Buttons)">
        <button onClick={handleSave} className="content-stretch flex flex-col items-start relative shrink-0 cursor-pointer group" data-name="Action 3">
          <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
            <div className={`content-stretch flex flex-col items-center justify-center relative rounded-[1000px] shrink-0 size-[70px] transition-colors ${
              saveSuccess ? 'bg-[#08f]' : 'bg-[#ededed] group-hover:bg-[#e0e0e0]'
            }`}>
              <div className={`flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 size-[70px] text-[25px] text-center tracking-[0.06px] transition-colors ${
                saveSuccess ? 'text-white' : 'text-[#333]'
              }`} style={{ fontVariationSettings: "'wdth' 100" }}>
                <p className="leading-[13px]">{saveSuccess ? '􀆅' : '􀈄'}</p>
              </div>
            </div>
            <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {saveSuccess ? 'Saved' : 'Save'}
            </p>
          </div>
        </button>
        <button onClick={handleShare} className="content-stretch flex flex-col items-start relative shrink-0 cursor-pointer group" data-name="Action 4">
          <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
            <div className={`content-stretch flex flex-col items-center justify-center relative rounded-[1000px] shrink-0 size-[70px] transition-colors ${
              shareSuccess ? 'bg-[#08f]' : 'bg-[#ededed] group-hover:bg-[#e0e0e0]'
            }`}>
              <div className={`flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 size-[70px] text-[25px] text-center tracking-[0.06px] transition-colors ${
                shareSuccess ? 'text-white' : 'text-[#333]'
              }`} style={{ fontVariationSettings: "'wdth' 100" }}>
                <p className="leading-[13px]">{shareSuccess ? '􀆅' : '􀈟'}</p>
              </div>
            </div>
            <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
              {shareSuccess ? 'Shared' : 'Share'}
            </p>
          </div>
        </button>
      </div>
      
      <button onClick={onGenerateNew} className="h-[22px] relative shrink-0 w-[204px] cursor-pointer" data-name="← Generate New Receipt">
        <p className="absolute font-['SF_Mono:Semibold',sans-serif] inset-0 leading-[22px] not-italic text-[15px] text-[rgba(0,0,0,0.5)] text-center text-nowrap hover:text-[rgba(0,0,0,0.7)] transition-colors">← Generate New Receipt</p>
      </button>
    </div>
  );
}

export const APP_ICONS = {
  instagram: imgInstagramIcon11,
  twitter: imgImg6929,
  linkedin: imgImg6930,
  messages: imgSystemIcons,
  calendar: imgImg6926,
  slack: imgImg6919,
  notes: imgSystemIcons1,
  mail: imgImg6921,
  notion: imgImg6925,
  youtube: imgImg6932,
  netflix: imgImg69331,
  spotify: imgImg6931,
};