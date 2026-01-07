import svgPaths from "./svg-j3yf4nq144";
import clsx from "clsx";
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
import imgThumbnail from "figma:asset/cc3cbcbda799046caa71bbff4ff7f6fc131cb066.png";
import imgAvatar from "figma:asset/4a4e35f140580fa875d902f0d2b9a74fb67acbb5.png";
import imgAvatar1 from "figma:asset/657112b8561c538adb09c89e9ac53d95cfa5fa37.png";
import imgAvatar2 from "figma:asset/aa14ab06ba60be2ce31164722e66d7262799da9c.png";
import imgAvatar3 from "figma:asset/4bd62685c42b1b271cb4896d23e09428896765cf.png";
import imgAvatar4 from "figma:asset/327cad5e9939300065ed59e7f94891c19e10157e.png";
import imgAvatar5 from "figma:asset/a5317ca03420503f743ecd3c4362839a25200ed5.png";
import imgIcon from "figma:asset/efad38269fc9004bd06e44a974b8877e6af3926c.png";
import imgIcon1 from "figma:asset/7d8c54338d14a1f9afdfff1bec90c42375e5050e.png";
import imgIcon2 from "figma:asset/9ca341c80a4541a890f7f3872b6a5bfd29b2d836.png";
type LevelsBackgroundImageProps = {
  additionalClassNames?: string;
};

function LevelsBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<LevelsBackgroundImageProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(0, 0, 0, 1)" } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}

function BackgroundImage6({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 size-[44px] text-[17px] text-black text-center">
      <p className="leading-[22px]">{children}</p>
    </div>
  );
}

function BackgroundImage5({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <p className="font-['SF_Mono:Semibold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[13px] text-black w-full">{children}</p>
      <BackgroundImage4>
        <line id="Line 1" stroke="var(--stroke-0, black)" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
      </BackgroundImage4>
    </div>
  );
}

function ActionBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[52px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[11px] py-0 relative size-full">{children}</div>
      </div>
    </div>
  );
}

function BackgroundImage4({ children }: React.PropsWithChildren<{}>) {
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
type TitleBackgroundImageAndTextProps = {
  text: string;
};

function TitleBackgroundImageAndText({ text }: TitleBackgroundImageAndTextProps) {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-start justify-center min-h-px min-w-px pb-px pt-0 px-0 relative shrink-0">
      <SeparatorBackgroundImage />
      <div className="basis-0 flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[17px] text-black text-nowrap tracking-[-0.43px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[22px] overflow-ellipsis overflow-hidden">{text}</p>
      </div>
    </div>
  );
}
type IconBackgroundImageProps = {
  additionalClassNames?: string;
};

function IconBackgroundImage({ additionalClassNames = "" }: IconBackgroundImageProps) {
  return (
    <div className={clsx("absolute left-[calc(50%+25px)] rounded-[5px] size-[20px] translate-x-[-50%]", additionalClassNames)}>
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[5px] size-full" src={imgSystemIcons} />
    </div>
  );
}
type NameBackgroundImageProps = {
  text: string;
  text1: string;
};

function NameBackgroundImage({ text, text1 }: NameBackgroundImageProps) {
  return (
    <div className="absolute content-stretch flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal gap-px items-start leading-[15px] left-0 text-[12px] text-black text-center text-nowrap top-[75px] tracking-[0.06px] w-[78px]">
      <p className="overflow-ellipsis overflow-hidden relative shrink-0 w-[78px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text}
      </p>
      <p className="overflow-ellipsis overflow-hidden relative shrink-0 w-[78px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        {text1}
      </p>
    </div>
  );
}

function SeparatorBackgroundImage() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e6e6e6] border-[1px_0px_0px] border-solid inset-[-1px_0_0_0] pointer-events-none" />
    </div>
  );
}

function FillBackgroundImage() {
  return (
    <div className="absolute inset-0 rounded-[296px]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[296px]">
        <div className="absolute bg-[#333] inset-0 mix-blend-color-dodge rounded-[296px]" />
        <div className="absolute inset-0 rounded-[296px]" style={{ backgroundImage: "linear-gradient(90deg, rgb(247, 247, 247) 0%, rgb(247, 247, 247) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%)" }} />
      </div>
    </div>
  );
}
type ThumbnailBackgroundImageProps = {
  additionalClassNames?: string;
};

function ThumbnailBackgroundImage({ additionalClassNames = "" }: ThumbnailBackgroundImageProps) {
  return (
    <div className={clsx("absolute inset-0 overflow-hidden rounded-[16px]", additionalClassNames)}>
      <img alt="" className="absolute left-[15.4%] max-w-none size-[68.79%] top-[17.66%]" src={imgThumbnail} />
    </div>
  );
}
type SymbolBackgroundImageAndTextProps = {
  text: string;
};

function SymbolBackgroundImageAndText({ text }: SymbolBackgroundImageAndTextProps) {
  return (
    <div className="bg-[#ededed] content-stretch flex flex-col items-center justify-center relative rounded-[1000px] shrink-0 size-[70px]">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 size-[70px] text-[#333] text-[25px] text-center tracking-[0.06px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13px]">{text}</p>
      </div>
    </div>
  );
}

function BackgroundImage3() {
  return (
    <BackgroundImage4>
      <line id="Line 1" stroke="var(--stroke-0, black)" strokeDasharray="2 2" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
    </BackgroundImage4>
  );
}
type BackgroundImage2Props = {
  text: string;
  text1: string;
};

function BackgroundImage2({ text, text1 }: BackgroundImage2Props) {
  return (
    <div className="content-stretch flex font-['SF_Mono:Semibold',sans-serif] items-start justify-between leading-[22px] not-italic relative shrink-0 text-[13px] w-full">
      <p className="relative self-stretch shrink-0 text-[rgba(0,0,0,0.5)] w-[97px]">{text}</p>
      <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{text1}</p>
    </div>
  );
}
type BackgroundImage1Props = {
  text: string;
  text1: string;
};

function BackgroundImage1({ text, text1 }: BackgroundImage1Props) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[97px]">
      <p className="min-w-full relative shrink-0 text-black w-[min-content]">{text}</p>
      <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{text1}</p>
    </div>
  );
}

function BackgroundImage() {
  return (
    <BackgroundImage4>
      <line id="Line 1" stroke="var(--stroke-0, black)" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
    </BackgroundImage4>
  );
}

function Separator() {
  return (
    <div className="relative shrink-0 w-full" data-name="Separator">
      <div className="content-stretch flex flex-col items-start px-[24px] py-0 relative w-full">
        <SeparatorBackgroundImage />
      </div>
    </div>
  );
}

export default function IPhone16Pro() {
  return (
    <div className="bg-[#f3f4f6] relative size-full" data-name="iPhone 16 Pro - 5">
      <div className="absolute content-stretch flex gap-[154px] items-center justify-center left-1/2 pb-[19px] pt-[21px] px-[16px] top-0 translate-x-[-50%] w-[402px]" data-name="Status bar - iPhone">
        <div className="basis-0 content-stretch flex grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0" data-name="Time">
          <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[22px] relative shrink-0 text-[17px] text-black text-center text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            9:41
          </p>
        </div>
        <div className="basis-0 content-stretch flex gap-[7px] grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-px px-0 relative shrink-0" data-name="Levels">
          <LevelsBackgroundImage additionalClassNames="h-[12.226px] w-[19.2px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 12.2264">
              <path clipRule="evenodd" d={svgPaths.p1e09e400} fill="var(--fill-0, black)" fillRule="evenodd" id="Cellular Connection" />
            </svg>
          </LevelsBackgroundImage>
          <LevelsBackgroundImage additionalClassNames="h-[12.328px] w-[17.142px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1417 12.3283">
              <path clipRule="evenodd" d={svgPaths.p18b35300} fill="var(--fill-0, black)" fillRule="evenodd" id="Wifi" />
            </svg>
          </LevelsBackgroundImage>
          <div className="h-[13px] relative shrink-0 w-[27.328px]" data-name="Battery">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.328 13">
              <g id="Battery">
                <rect height="12" id="Border" opacity="0.35" rx="3.8" stroke="var(--stroke-0, black)" width="24" x="0.5" y="0.5" />
                <path d={svgPaths.p3bbd9700} fill="var(--fill-0, black)" id="Cap" opacity="0.4" />
                <rect fill="var(--fill-0, black)" height="9" id="Capacity" rx="2.5" width="21" x="2" y="2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 h-[34px] left-1/2 translate-x-[-50%] w-[400px]" data-name="Home Indicator">
        <div className="absolute bottom-[8px] flex h-[5px] items-center justify-center left-1/2 translate-x-[-50%] w-[144px]">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">
            <div className="bg-black h-[5px] rounded-[100px] w-[144px]" data-name="Home Indicator" />
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-[33px] top-[86px] w-[337px]">
        <div className="bg-white relative shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0 w-full">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col gap-[32px] items-center px-[24px] py-[32px] relative w-full">
              <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-col font-['SF_Mono:Semibold',sans-serif] gap-[4px] items-center not-italic relative shrink-0 text-center w-[201px]">
                  <p className="leading-[22px] min-w-full relative shrink-0 text-[17px] text-black w-[min-content]">DIGITAL RECEIPT</p>
                  <p className="leading-[22px] relative shrink-0 text-[13px] text-[rgba(0,0,0,0.5)] text-nowrap">Weekly Screen Time Summary</p>
                  <div className="leading-[22px] relative shrink-0 text-[13px] text-[rgba(0,0,0,0.8)] text-nowrap">
                    <p className="mb-0">09/14/25 - 09/21/25</p>
                    <p>Generated 09:41 PM</p>
                  </div>
                </div>
                <BackgroundImage />
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[289px]">
                <BackgroundImage5>{`SOCIAL & COMMUNICATION`}</BackgroundImage5>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative rounded-[12px] shrink-0 size-[44px]" data-name="Instagram_icon (1) 1">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgInstagramIcon11} />
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="INSTAGRAM" text1="SOCIAL MEDIA" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">2h 34m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[44.379px] relative rounded-[11.379px] shrink-0 w-[44px]" data-name="IMG_6929">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.379px]">
                      <img alt="" className="absolute h-[1225.64%] left-[-39.66%] max-w-none top-[-671.79%] w-[568.97%]" src={imgImg6929} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="TWITTER/X" text1="SOCIAL MEDIA" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">1h 47m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative rounded-[11px] shrink-0 size-[44px]" data-name="IMG_6930">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11px]">
                      <img alt="" className="absolute h-[1236.21%] left-[-168.97%] max-w-none top-[-256.03%] w-[568.97%]" src={imgImg6930} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="LINKEDIN" text1="SOCIAL MEDIA" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">3h 48m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[44px]" data-name="_System Icons">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSystemIcons} />
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="MESSAGES" text1="COMMUNICATION" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">38m</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <BackgroundImage3 />
                  <BackgroundImage2 text="SUBTOTAL:" text1="8h 47m" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[289px]">
                <BackgroundImage5>{`WORK & PRODUCTIVITY`}</BackgroundImage5>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative rounded-[10.891px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 size-[44px]" data-name="IMG_6926">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10.891px]">
                      <img alt="" className="absolute h-[1419.8%] left-[-500.99%] max-w-none top-[-301.98%] w-[653.47%]" src={imgImg6926} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="CALENDAR" text1="PRODUCTIVITY" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">28m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[44px] relative rounded-[11.759px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-[44.379px]" data-name="IMG_6919">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.759px]">
                      <img alt="" className="absolute h-[1236.21%] left-[-167.52%] max-w-none top-[-115.52%] w-[564.1%]" src={imgImg6919} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="SLACK" text1="WORK" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">2h 23m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[44px]" data-name="_System Icons">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSystemIcons1} />
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="NOTES" text1="PRODUCTIVITY" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">13m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[44px] relative shrink-0 w-[44.25px]" data-name="IMG_6921">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img alt="" className="absolute h-[814.77%] left-[-16.95%] max-w-none top-[-107.95%] w-[372.88%]" src={imgImg6921} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="MAIL" text1="WORK" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">1h 17m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative rounded-[11.327px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 size-[44px]" data-name="IMG_6925">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.327px]">
                      <img alt="" className="absolute h-[1419.8%] left-[-351.49%] max-w-none top-[-301.98%] w-[653.47%]" src={imgImg6925} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="NOTION" text1="PRODUCTIVITY" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">45m</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <BackgroundImage3 />
                  <BackgroundImage2 text="SUBTOTAL:" text1="5h 06m" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[289px]">
                <BackgroundImage5>ENTERTAINMENT</BackgroundImage5>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[44px] relative rounded-[11.658px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-[43.624px]" data-name="IMG_6932">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.658px]">
                      <img alt="" className="absolute h-[1225.64%] left-[-300%] max-w-none top-[-811.11%] w-[568.97%]" src={imgImg6932} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="YOUTUBE" text1="ENTERTAINMENT" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">3h 17m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[43.254px] relative rounded-[11.186px] shrink-0 w-[44px]" data-name="IMG_6933 1">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.186px]">
                      <img alt="" className="absolute h-[1236.21%] left-[-422.03%] max-w-none top-[-818.1%] w-[559.32%]" src={imgImg69331} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="NETFLIX" text1="STREAMING" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">1h 52m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[43.254px] relative rounded-[10.814px] shrink-0 w-[44px]" data-name="IMG_6931">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10.814px]">
                      <img alt="" className="absolute h-[1236.21%] left-[-294.07%] max-w-none top-[-115.52%] w-[559.32%]" src={imgImg6931} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <BackgroundImage1 text="SPOTIFY" text1="MUSIC" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">5h 03m</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <BackgroundImage3 />
                  <BackgroundImage2 text="SUBTOTAL:" text1="10h 12m" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                  <BackgroundImage />
                  <div className="content-stretch flex font-['SF_Mono:Semibold',sans-serif] items-start justify-between leading-[22px] not-italic relative shrink-0 text-[17px] text-nowrap w-full">
                    <p className="relative shrink-0 text-black">GRAND TOTAL:</p>
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.8)] text-center">24h 05m</p>
                  </div>
                  <BackgroundImage />
                </div>
                <div className="content-stretch flex flex-col font-['SF_Mono:Semibold',sans-serif] gap-[16px] items-start not-italic relative shrink-0 text-center w-full">
                  <p className="leading-[22px] relative shrink-0 text-[17px] text-[rgba(0,0,0,0.6)] w-full">THANK YOU FOR VISITING!</p>
                  <div className="leading-[22px] relative shrink-0 text-[15px] text-[rgba(0,0,0,0.4)] w-full">
                    <p className="mb-0">Recommendation:</p>
                    <p>Go touch some grass 🌱</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[24px] items-center justify-center px-0 py-[16px] relative shrink-0 w-full" data-name="Actions (Buttons)">
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Action 3">
            <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
              <SymbolBackgroundImageAndText text="􀈄" />
              <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                Save
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Action 4">
            <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
              <SymbolBackgroundImageAndText text="􀈟" />
              <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                Share
              </p>
            </div>
          </div>
        </div>
        <div className="h-[22px] relative shrink-0 w-[204px]" data-name="← Generate New Receipt">
          <p className="absolute font-['SF_Mono:Semibold',sans-serif] inset-0 leading-[22px] not-italic text-[15px] text-[rgba(0,0,0,0.5)] text-center text-nowrap">← Generate New Receipt</p>
        </div>
      </div>
      <div className="absolute bg-[rgba(41,41,58,0.23)] h-[1726px] left-0 rounded-[42px] top-0 w-[402px]" data-name="Overlay - Alerts" />
      <div className="absolute bottom-[-344px] h-[992px] left-[calc(50%+1px)] overflow-clip translate-x-[-50%] w-[402px]" data-name="Activity View - iPhone">
        <div className="absolute bg-[#f2f2f7] content-stretch flex flex-col inset-0 items-center rounded-tl-[38px] rounded-tr-[38px] shadow-[0px_15px_75px_0px_rgba(0,0,0,0.18)]" data-name="Sheet" />
        <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip right-0 top-0" data-name="Activity View">
          <div className="relative shrink-0 w-full" data-name="Header">
            <div className="content-stretch flex gap-[16px] items-start p-[16px] relative w-full">
              <div className="content-stretch flex flex-col items-center pb-0 pl-[12px] pr-0 pt-[14px] relative self-stretch shrink-0" data-name="Thumbnail">
                <div className="pointer-events-none relative rounded-[16px] shrink-0 size-[64px]" data-name="Thumbnail">
                  <div aria-hidden="true" className="absolute inset-0 rounded-[16px]">
                    <div className="absolute bg-[#f3f4f6] inset-0 rounded-[16px]" />
                    <ThumbnailBackgroundImage />
                    <ThumbnailBackgroundImage additionalClassNames="mix-blend-multiply" />
                  </div>
                  <div aria-hidden="true" className="absolute border-[0.5px] border-[rgba(0,0,0,0.15)] border-solid inset-0 rounded-[16px] shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]" />
                </div>
              </div>
              <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px pb-[2px] pt-[12px] px-0 relative shrink-0" data-name="Middle">
                <div className="content-stretch flex flex-col gap-px items-start leading-[0] relative shrink-0 text-nowrap w-full" data-name="Title and Subtitle">
                  <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-[20px] justify-center overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[15px] tracking-[-0.23px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[20px] overflow-ellipsis overflow-hidden text-nowrap">Screen Time Receipt</p>
                  </div>
                  <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal h-[18px] justify-center overflow-ellipsis overflow-hidden relative shrink-0 text-[#999] text-[13px] tracking-[-0.08px] w-[215px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[18px] overflow-ellipsis overflow-hidden text-nowrap">Weekly Time Summary</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-start justify-center pb-[10px] pt-0 px-[16px] relative shrink-0 size-[44px]" data-name="Close Button">
                <div className="bg-white content-stretch flex gap-[12px] h-[44px] items-center justify-center mix-blend-multiply px-[4px] py-0 relative rounded-[296px] shrink-0" data-name="Close">
                  <div className="absolute h-[44px] left-0 right-0 top-1/2 translate-y-[-50%]" data-name="BG">
                    <div className="absolute inset-[-26px] opacity-[0.67]" data-name="Blur">
                      <div className="absolute bg-white inset-[-50px]" data-name="Mask">
                        <div className="absolute bg-black inset-[76px] rounded-[1000px]" data-name="Shape" />
                      </div>
                      <div className="absolute backdrop-blur-[20px] backdrop-filter bg-[rgba(0,0,0,0.04)] blur-[10px] filter inset-[28px_26px_24px_26px] mix-blend-hard-light rounded-[1000px]" data-name="Blur" />
                    </div>
                    <FillBackgroundImage />
                    <div className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[296px]" data-name="Glass Effect" />
                  </div>
                  <div className="content-stretch flex flex-col items-start relative rounded-[100px] shrink-0 size-[36px]" data-name="Symbol 1">
                    <div className="basis-0 flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#404040] text-[17px] text-center w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal]">􀆄</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <div className="relative shrink-0 w-full" data-name="Contacts Row">
            <div className="content-stretch flex gap-[14px] items-start pb-[16px] pl-[24px] pr-0 pt-[14px] relative w-full">
              <div className="h-[104px] relative shrink-0 w-[78px]" data-name="Contact">
                <NameBackgroundImage text="Ashley" text1="Kamin" />
                <div className="absolute left-1/2 rounded-[100px] size-[70px] top-0 translate-x-[-50%]" data-name="Avatar">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgAvatar} />
                </div>
                <IconBackgroundImage additionalClassNames="top-[50px]" />
              </div>
              <div className="h-[104px] relative shrink-0 w-[78px]" data-name="Contact">
                <NameBackgroundImage text="Amber" text1="Spiers" />
                <div className="absolute left-1/2 rounded-[100px] size-[70px] top-0 translate-x-[-50%]" data-name="Avatar">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgAvatar1} />
                </div>
                <IconBackgroundImage additionalClassNames="top-[50px]" />
              </div>
              <div className="h-[104px] relative shrink-0 w-[78px]" data-name="Contact">
                <div className="absolute content-stretch flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal gap-px items-center left-1/2 text-center text-nowrap top-[75px] tracking-[0.06px] translate-x-[-50%] w-[78px]" data-name="Names">
                  <p className="leading-[13px] overflow-ellipsis overflow-hidden relative shrink-0 text-[10px] text-black w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                    Gary and Fatima
                  </p>
                  <p className="leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[12px] text-[rgba(60,60,67,0.6)] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                    2 People
                  </p>
                </div>
                <div className="absolute bg-[rgba(120,120,128,0.16)] left-1/2 rounded-[100px] size-[70px] top-[-1px] translate-x-[-50%]" data-name="Group">
                  <div className="absolute bottom-[9px] right-[9px] rounded-[100px] size-[22px]" data-name="Avatar 2">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgAvatar2} />
                  </div>
                  <div className="absolute left-[9px] rounded-[100px] size-[37.333px] top-[9px]" data-name="Avatar 1">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgAvatar3} />
                  </div>
                </div>
                <IconBackgroundImage additionalClassNames="top-[49px]" />
              </div>
              <div className="h-[104px] relative shrink-0 w-[78px]" data-name="Contact">
                <NameBackgroundImage text="Simon" text1="Pickford" />
                <div className="absolute left-1/2 rounded-[100px] size-[70px] top-0 translate-x-[-50%]" data-name="Avatar">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgAvatar4} />
                </div>
                <IconBackgroundImage additionalClassNames="top-[50px]" />
              </div>
              <div className="h-[104px] relative shrink-0 w-[78px]" data-name="Contact">
                <NameBackgroundImage text="Kristina" text1="Pickles" />
                <div className="absolute left-1/2 rounded-[100px] size-[70px] top-0 translate-x-[-50%]" data-name="Avatar">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[100px] size-full" src={imgAvatar5} />
                </div>
                <IconBackgroundImage additionalClassNames="top-[50px]" />
              </div>
            </div>
          </div>
          <Separator />
          <div className="relative shrink-0 w-full" data-name="App Icon Row">
            <div className="content-stretch flex gap-[14px] items-start pb-[20px] pl-[24px] pr-0 pt-[18px] relative w-full">
              <div className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px]" data-name="App 1">
                <div className="relative rounded-[15px] shrink-0 size-[70px]" data-name="Icon">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[15px] size-full" src={imgIcon} />
                </div>
                <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-ellipsis overflow-hidden relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  AirDrop
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px]" data-name="App 2">
                <div className="relative rounded-[15px] shrink-0 size-[70px]" data-name="Icon">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[15px] size-full" src={imgSystemIcons} />
                </div>
                <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-ellipsis overflow-hidden relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Messages
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px]" data-name="App 3">
                <div className="relative rounded-[15px] shrink-0 size-[70px]" data-name="Icon">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[15px] size-full" src={imgIcon1} />
                </div>
                <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-ellipsis overflow-hidden relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Mail
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px]" data-name="App 4">
                <div className="relative rounded-[15px] shrink-0 size-[70px]" data-name="Icon">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[15px] size-full" src={imgSystemIcons1} />
                </div>
                <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-ellipsis overflow-hidden relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Notes
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-center pb-[2px] pt-0 px-0 relative shrink-0 w-[78px]" data-name="App 5">
                <div className="relative rounded-[15px] shrink-0 size-[70px]" data-name="Icon">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[15px] size-full" src={imgIcon2} />
                </div>
                <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[13px] leading-[13px] overflow-ellipsis overflow-hidden relative shrink-0 text-[11px] text-black text-center text-nowrap tracking-[0.06px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Reminders
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="relative shrink-0 w-full" data-name="Actions (Buttons)">
            <div className="content-stretch flex gap-[14px] items-start pb-[20px] pl-[24px] pr-0 pt-[14px] relative w-full">
              <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 1">
                <SymbolBackgroundImageAndText text="􀉁" />
                <p className="font-['SF_Pro:Regular',sans-serif] font-normal h-[30px] leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Copy
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 2">
                <SymbolBackgroundImageAndText text="􀋂" />
                <p className="-webkit-box font-['SF_Pro:Regular',sans-serif] font-normal h-[30px] leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center tracking-[-0.1px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Add to Favorites
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
                <SymbolBackgroundImageAndText text="􀖆" />
                <p className="-webkit-box font-['SF_Pro:Regular',sans-serif] font-normal h-[30px] leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center tracking-[-0.1px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Add to Reading List
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 4">
                <SymbolBackgroundImageAndText text="􀉚" />
                <p className="-webkit-box font-['SF_Pro:Regular',sans-serif] font-normal h-[30px] leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center tracking-[-0.1px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Add Bookmark
                </p>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 w-full" data-name="Actions (List)">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="content-stretch flex flex-col gap-[20px] items-center justify-center pb-[20px] pt-[2px] px-[16px] relative w-full">
                <div className="bg-[rgba(120,120,128,0.16)] content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Action Group 2">
                  <ActionBackgroundImage>
                    <BackgroundImage6>􀖆</BackgroundImage6>
                    <TitleBackgroundImageAndText text="Add to Reading List" />
                  </ActionBackgroundImage>
                  <ActionBackgroundImage>
                    <BackgroundImage6>􀉚</BackgroundImage6>
                    <TitleBackgroundImageAndText text="Add Bookmark" />
                  </ActionBackgroundImage>
                  <ActionBackgroundImage>
                    <BackgroundImage6>􀋂</BackgroundImage6>
                    <TitleBackgroundImageAndText text="Add to Favorites" />
                  </ActionBackgroundImage>
                  <ActionBackgroundImage>
                    <BackgroundImage6>􀑍</BackgroundImage6>
                    <TitleBackgroundImageAndText text="Add to Home Screen" />
                  </ActionBackgroundImage>
                </div>
                <div className="bg-[rgba(120,120,128,0.16)] content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Action Group 3">
                  <ActionBackgroundImage>
                    <BackgroundImage6>􀉥</BackgroundImage6>
                    <TitleBackgroundImageAndText text="Markup" />
                  </ActionBackgroundImage>
                  <ActionBackgroundImage>
                    <BackgroundImage6>􀎚</BackgroundImage6>
                    <TitleBackgroundImageAndText text="Print" />
                  </ActionBackgroundImage>
                </div>
                <div className="content-stretch flex gap-[4px] items-center justify-center px-[20px] py-[6px] relative rounded-[1000px] shrink-0" data-name="Button - Liquid Glass - Text">
                  <div className="absolute inset-[-26px] opacity-[0.67]" data-name="Blur">
                    <div className="absolute bg-white inset-[-50px]" data-name="Mask">
                      <div className="absolute bg-black inset-[76px] rounded-[1000px]" data-name="Shape" />
                    </div>
                    <div className="absolute backdrop-blur-[20px] backdrop-filter bg-[rgba(0,0,0,0.04)] blur-[10px] filter inset-[28px_26px_24px_26px] mix-blend-hard-light rounded-[1000px]" data-name="Blur" />
                  </div>
                  <FillBackgroundImage />
                  <div className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[296px]" data-name="Glass Effect" />
                  <div className="content-stretch flex h-[36px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Text">
                    <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[#404040] text-[17px] text-center text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal]">Edit Actions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bg-[rgba(60,60,67,0.3)] h-[5px] left-[calc(50%-1px)] rounded-[2.5px] top-[5px] translate-x-[-50%] w-[36px]" data-name="Grabber" />
        </div>
      </div>
    </div>
  );
}