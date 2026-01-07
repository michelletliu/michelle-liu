import svgPaths from "./svg-bc4vjhlltd";
import clsx from "clsx";
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
type HomeIndicatorProps = {
  additionalClassNames?: string;
};

function HomeIndicator({ additionalClassNames = "" }: HomeIndicatorProps) {
  return (
    <div className={clsx("absolute h-[34px] left-1/2 translate-x-[-50%] w-[400px]", additionalClassNames)}>
      <div className="absolute bottom-[8px] flex h-[5px] items-center justify-center left-1/2 translate-x-[-50%] w-[144px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="bg-black h-[5px] rounded-[100px] w-[144px]" data-name="Home Indicator" />
        </div>
      </div>
    </div>
  );
}

export default function IPhone16Pro() {
  return (
    <div className="bg-[#f3f4f6] relative size-full" data-name="iPhone 16 Pro - 3">
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
      <HomeIndicator additionalClassNames="bottom-[-852px]" />
      <HomeIndicator additionalClassNames="bottom-0" />
      <div className="absolute bg-white content-stretch flex flex-col gap-[24px] items-center left-[calc(50%+0.5px)] px-[48px] py-[32px] rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%]">
        <div className="bg-[rgba(116,116,128,0.08)] content-stretch flex flex-col items-center justify-center p-[10px] relative rounded-[999px] shrink-0 size-[120px]">
          <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#8e8e93] text-[60px] text-center w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            􀟜
          </p>
        </div>
        <div className="font-['SF_Mono:Regular',sans-serif] leading-[28px] not-italic relative shrink-0 text-[22px] text-black text-center text-nowrap">
          <p className="mb-0">SCREEN TIME</p>
          <p>RECEIPT</p>
        </div>
        <div className="content-stretch flex items-start relative shrink-0" data-name="Segmented control">
          <div className="bg-[rgba(118,118,128,0.12)] content-stretch flex h-[36px] items-center justify-center overflow-clip px-[8px] py-[4px] relative rounded-[100px] shrink-0 w-[209px]" data-name="Segmented control">
            <div className="basis-0 grow h-full min-h-px min-w-px relative rounded-[7px] shrink-0" data-name="Button 1">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[10px] py-[2px] relative size-full">
                  <div className="absolute bg-white inset-[0_-4.5px_0_-4px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]" data-name="Button" />
                  <p className="basis-0 font-['SF_Pro:Semibold',sans-serif] font-[590] grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap tracking-[-0.08px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    Daily
                  </p>
                </div>
              </div>
            </div>
            <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0" data-name="Button 2">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[10px] py-[3px] relative size-full">
                  <p className="basis-0 font-['SF_Pro:Medium',sans-serif] font-[510] grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap tracking-[-0.08px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    Weekly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#404040] content-stretch flex items-center justify-center px-[20px] py-[10px] relative rounded-[999px] shrink-0" data-name="Button">
          <p className="font-['SF_Mono:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[15px] text-center text-nowrap text-white tracking-[0.75px]">GENERATE</p>
        </div>
      </div>
    </div>
  );
}