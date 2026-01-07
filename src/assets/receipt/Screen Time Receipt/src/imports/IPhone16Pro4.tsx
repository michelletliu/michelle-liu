import svgPaths from "./svg-ffb2b86swr";
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
type LevelsHelperProps = {
  additionalClassNames?: string;
};

function LevelsHelper({ children, additionalClassNames = "" }: React.PropsWithChildren<LevelsHelperProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(0, 0, 0, 1)" } as React.CSSProperties}>
        {children}
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

function Frame20Helper() {
  return (
    <Wrapper>
      <line id="Line 1" stroke="var(--stroke-0, black)" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
    </Wrapper>
  );
}

function Helper2() {
  return (
    <Wrapper>
      <line id="Line 1" stroke="var(--stroke-0, black)" strokeDasharray="2 2" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
    </Wrapper>
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

export default function IPhone16Pro() {
  return (
    <div className="bg-[#f3f4f6] relative size-full" data-name="iPhone 16 Pro - 4">
      <div className="absolute bg-gradient-to-b from-[#f3f4f6] from-[32.87%] h-[108px] left-1/2 to-[rgba(243,244,246,0)] top-0 translate-x-[-50%] w-[402px]" data-name="Status bar - iPhone" />
      <div className="absolute content-stretch flex gap-[154px] items-center justify-center left-1/2 pb-[19px] pt-[21px] px-[16px] top-0 translate-x-[-50%] w-[402px]" data-name="Status bar - iPhone">
        <div className="basis-0 content-stretch flex grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0" data-name="Time">
          <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[22px] relative shrink-0 text-[17px] text-black text-center text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            9:41
          </p>
        </div>
        <div className="basis-0 content-stretch flex gap-[7px] grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-px px-0 relative shrink-0" data-name="Levels">
          <LevelsHelper additionalClassNames="h-[12.226px] w-[19.2px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 12.2264">
              <path clipRule="evenodd" d={svgPaths.p1e09e400} fill="var(--fill-0, black)" fillRule="evenodd" id="Cellular Connection" />
            </svg>
          </LevelsHelper>
          <LevelsHelper additionalClassNames="h-[12.328px] w-[17.142px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1417 12.3283">
              <path clipRule="evenodd" d={svgPaths.p18b35300} fill="var(--fill-0, black)" fillRule="evenodd" id="Wifi" />
            </svg>
          </LevelsHelper>
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
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[289px]">
                <Wrapper1>{`SOCIAL & COMMUNICATION`}</Wrapper1>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative rounded-[12px] shrink-0 size-[44px]" data-name="Instagram_icon (1) 1">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[12px] size-full" src={imgInstagramIcon11} />
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <Helper text="INSTAGRAM" text1="SOCIAL MEDIA" />
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
                    <Helper text="TWITTER/X" text1="SOCIAL MEDIA" />
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
                    <Helper text="LINKEDIN" text1="SOCIAL MEDIA" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">3h 48m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[44px]" data-name="_System Icons">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSystemIcons} />
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <Helper text="MESSAGES" text1="COMMUNICATION" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">38m</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <Helper2 />
                  <Helper1 text="SUBTOTAL:" text1="8h 47m" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[289px]">
                <Wrapper1>{`WORK & PRODUCTIVITY`}</Wrapper1>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative rounded-[10.891px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 size-[44px]" data-name="IMG_6926">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10.891px]">
                      <img alt="" className="absolute h-[1419.8%] left-[-500.99%] max-w-none top-[-301.98%] w-[653.47%]" src={imgImg6926} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <Helper text="CALENDAR" text1="PRODUCTIVITY" />
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
                    <Helper text="SLACK" text1="WORK" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">2h 23m</p>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[44px]" data-name="_System Icons">
                    <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgSystemIcons1} />
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <Helper text="NOTES" text1="PRODUCTIVITY" />
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
                    <Helper text="MAIL" text1="WORK" />
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
                    <Helper text="NOTION" text1="PRODUCTIVITY" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">45m</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <Helper2 />
                  <Helper1 text="SUBTOTAL:" text1="5h 06m" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[289px]">
                <Wrapper1>ENTERTAINMENT</Wrapper1>
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
                  <div className="h-[44px] relative rounded-[11.658px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-[43.624px]" data-name="IMG_6932">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[11.658px]">
                      <img alt="" className="absolute h-[1225.64%] left-[-300%] max-w-none top-[-811.11%] w-[568.97%]" src={imgImg6932} />
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex font-['SF_Mono:Semibold',sans-serif] grow items-start justify-between leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[13px]">
                    <Helper text="YOUTUBE" text1="ENTERTAINMENT" />
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
                    <Helper text="NETFLIX" text1="STREAMING" />
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
                    <Helper text="SPOTIFY" text1="MUSIC" />
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">5h 03m</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <Helper2 />
                  <Helper1 text="SUBTOTAL:" text1="10h 12m" />
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                  <Frame20Helper />
                  <div className="content-stretch flex font-['SF_Mono:Semibold',sans-serif] items-start justify-between leading-[22px] not-italic relative shrink-0 text-[17px] text-nowrap w-full">
                    <p className="relative shrink-0 text-black">GRAND TOTAL:</p>
                    <p className="relative shrink-0 text-[rgba(0,0,0,0.8)] text-center">24h 05m</p>
                  </div>
                  <Frame20Helper />
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
              <SymbolText text="􀈄" />
              <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                Save
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Action 4">
            <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
              <SymbolText text="􀈟" />
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
      <div className="absolute bg-[rgba(41,41,58,0.23)] h-[1726px] left-0 opacity-0 rounded-[42px] top-0 w-[402px]" data-name="Overlay - Alerts" />
    </div>
  );
}