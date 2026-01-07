import svgPaths from "./svg-1067wqojux";
import clsx from "clsx";
import imgFinalSealLogo1 from "../assets/logo.png";
import { imgGroup } from "./svg-6pxh4";
import { ArrowUpRight } from "../components/ArrowUpRight";

function AppleCoverBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full">
      <video autoPlay className="absolute max-w-none object-cover rounded-[26px] size-full" controlsList="nodownload" loop playsInline>
        {children}
      </video>
    </div>
  );
}

function SocialLinksBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Social Links">{children}</g>
      </svg>
    </div>
  );
}
type LinksBackgroundImageAndTextProps = {
  text: string;
};

function LinksBackgroundImageAndText({ text }: LinksBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative rounded-[999px] shrink-0">
      <p className="font-['Figtree',sans-serif] font-semibold leading-[20px] relative shrink-0 text-[#9ca3af] text-[16px] text-nowrap tracking-[0.16px]">{text}</p>
    </div>
  );
}
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ additionalClassNames = "" }: BackgroundImage2Props) {
  return (
    <video autoPlay controlsList="nodownload" loop playsInline className={clsx("absolute max-w-none object-cover size-full", additionalClassNames)}>
      <source src="/_videos/v1/e1a08fc1de0f94dc450713914a82ab3fefd8c902" />
    </video>
  );
}
type BackgroundImage1Props = {
  text: string;
  text1: string;
};

function BackgroundImage1({ text, text1 }: BackgroundImage1Props) {
  return (
    <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-medium items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-[16px]">
      <p className="relative shrink-0 text-[#111827] w-full">
        <span>{`Roblox `}</span>
        <span className="text-[#9ca3af]">{text}</span>
      </p>
      <p className="relative shrink-0 text-[#9ca3af] w-full">{text1}</p>
    </div>
  );
}
type BackgroundImageProps = {
  text: string;
  text1: string;
};

function BackgroundImage({ text, text1 }: BackgroundImageProps) {
  return (
    <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-medium items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-[16px]">
      <p className="relative shrink-0 text-[#111827] w-full">
        <span>{`Apple `}</span>
        <span className="text-[#9ca3af]">{text}</span>
      </p>
      <p className="relative shrink-0 text-[#9ca3af] w-full">{text1}</p>
    </div>
  );
}
type TagBackgroundImageAndTextProps = {
  text: string;
};

function TagBackgroundImageAndText({ text }: TagBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex items-center justify-center px-[12px] py-[4px] relative rounded-[999px] shrink-0">
      <p className="font-['Figtree',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#9ca3af] text-[16px] text-nowrap tracking-[0.16px]">{text}</p>
    </div>
  );
}
type FinalSealLogoBackgroundImageProps = {
  additionalClassNames?: string;
};

function FinalSealLogoBackgroundImage({ additionalClassNames = "" }: FinalSealLogoBackgroundImageProps) {
  return (
    <div className={clsx("absolute left-0", additionalClassNames)}>
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgFinalSealLogo1} />
    </div>
  );
}

export default function Test() {
  return (
    <div className="relative size-full" data-name="Test">
      <div className="absolute bg-white content-stretch flex flex-col items-center left-0 top-0 w-[1440px]" data-name="V1">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Header" style={{ backgroundImage: "linear-gradient(16.0073deg, rgb(255, 255, 255) 59.622%, rgb(243, 218, 255) 81.196%, rgb(192, 221, 254) 97.554%, rgb(154, 226, 244) 128.88%)" }}>
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="content-stretch flex flex-col items-start p-[32px] relative w-full">
                <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                  <div className="overflow-clip relative shrink-0 size-[44px]" data-name="Logo">
                    <FinalSealLogoBackgroundImage additionalClassNames="h-[64.883px] top-[-10.44px] w-[45.32px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="content-stretch flex flex-col gap-[36px] items-start pb-[16px] pt-[44px] px-[32px] relative w-full">
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                  <p className="font-['Figtree',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#374151] text-[64px] w-full">michelle liu</p>
                  <p className="font-['Figtree',sans-serif] font-normal leading-[28px] not-italic relative shrink-0 text-[#6b7280] text-[0px] text-[20px] w-full">
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{`Designing useful products to spark moments of `}</span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">delight</span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{` & `}</span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">human connection.</span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">
                      <br aria-hidden="true" />
                      {`Previously at `}
                    </span>
                    <span className="font-['Figtree',sans-serif] text-[#374151]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      
                    </span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{`, `}</span>
                    <span className="font-['Figtree',sans-serif] text-[#374151]">Roblox</span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{`, & `}</span>
                    <span className="font-['Figtree',sans-serif] text-[#374151]">NASA</span>
                    <span className="font-['Figtree',sans-serif] text-[#9ca3af]">.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-center pb-[16px] pt-0 px-0 relative shrink-0 w-full">
          <div className="relative shrink-0 w-full" data-name="Header Breakpoint">
            <div className="size-full">
              <div className="content-stretch flex flex-col gap-[12px] items-start pb-0 pt-[16px] px-[32px] relative w-full">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
                  <div className="bg-[rgba(107,114,128,0.1)] content-stretch flex items-center justify-center px-[12px] py-[4px] relative rounded-[999px] shrink-0" data-name="Tag">
                    <p className="font-['Figtree',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#4b5563] text-[16px] text-nowrap tracking-[0.16px]">WORK</p>
                  </div>
                  <TagBackgroundImageAndText text="ART" />
                  <TagBackgroundImageAndText text="ABOUT" />
                </div>
              </div>
            </div>
          </div>
          <div className="gap-[16px] grid-cols-[repeat(2,_fit-content(100%))] grid-rows-[repeat(4,_fit-content(100%))] inline-grid relative shrink-0">
            <div className="[grid-area:1_/_1] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/178dbff1fec6d1345d7a772692731154947b7aef" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage text="• 2025" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:1_/_2] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/ec4f5676616e35a7cfffe3caab293e4284f6b764" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage1 text="• 2024" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:2_/_1] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/7ff3f920282132ea0b7ed8c097d7da8b417608f9" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage text="• 2025" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:2_/_2] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/6518b118d3c673463cab3ef6c46374eca2bcb6e5" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage text="• 2025" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:3_/_1] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <div className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full" data-name="Apple Cover">
                  <BackgroundImage2 additionalClassNames="rounded-[26px]" />
                </div>
              </div>
              <BackgroundImage text="• 2025" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:3_/_2] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/c9388f3c9f7f89cdcd536abfedfaf06c9f677b0b" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage text="• 2025" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:4_/_1] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/a7d89d5e0ec7653d5a65dc73a8c637d966cb3295" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage1 text="• 2024" text1="Designing new features to drive engagement and user delight." />
            </div>
            <div className="[grid-area:4_/_2] content-stretch flex flex-col gap-[12px] items-start relative self-start shrink-0 w-[678px]" data-name="Project Card">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full" data-name="Image">
                <AppleCoverBackgroundImage>
                  <source src="/_videos/v1/2f11cff5870795617ad1ebfe3cbd1f3281c493fd" />
                </AppleCoverBackgroundImage>
              </div>
              <BackgroundImage text="• 2025" text1="Designing new features to drive engagement and user delight." />
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Footer">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col gap-[60px] items-center px-[32px] py-[60px] relative w-full">
              <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                <div className="bg-[#e5e7eb] h-px shrink-0 w-full" />
                <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0">
                    <div className="content-stretch flex gap-[8px] items-center justify-center px-0 py-[4px] relative shrink-0">
                      <div className="overflow-clip relative shrink-0 size-[28px]" data-name="Logo">
                        <FinalSealLogoBackgroundImage additionalClassNames="h-[41.289px] top-[-6.64px] w-[28.84px]" />
                      </div>
                      <p className="font-['Figtree',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#374151] text-[32px] w-[212px]">michelle liu</p>
                    </div>
                    <p className="font-['Figtree',sans-serif] font-normal leading-[28px] relative shrink-0 text-[#9ca3af] text-[16px] text-nowrap">
                      <span>{`Built with Next.js & `}</span>
                      <a className="[text-underline-position:from-font] cursor-pointer decoration-solid underline" href="https://www.rockysmatcha.com/">
                        <span className="[text-underline-position:from-font] decoration-solid leading-[28px]" href="https://www.rockysmatcha.com/">
                          rocky’s matcha
                        </span>
                      </a>
                      <span>{` lattes.`}</span>
                    </p>
                  </div>
                  <div className="content-stretch flex items-start justify-between relative shrink-0 w-[678px]">
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[338px]">
                      <LinksBackgroundImageAndText text="WORK" />
                      <LinksBackgroundImageAndText text="ART" />
                      <LinksBackgroundImageAndText text="ABOUT" />
                    </div>
                    <div className="content-stretch flex flex-col gap-[44px] items-start relative shrink-0">
                      <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start relative shrink-0 text-[#9ca3af] w-[326px]">
                        <p className="leading-[24px] relative shrink-0 text-[16px] w-full">Let’s work together!</p>
                        <p className="leading-[24px] relative shrink-0 text-[0px] text-[16px] w-full">
                          <span>{`michelletheresaliu@gmail.com `}</span>
                          <span className="font-['Figtree',sans-serif] font-bold"><ArrowUpRight /></span>
                        </p>
                      </div>
                      <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[326px]">
                        <div className="content-stretch flex gap-[44px] items-start relative shrink-0" data-name="Social Links">
                          <SocialLinksBackgroundImage>
                            <path d={svgPaths.p2c5f2300} fill="var(--fill-0, #6B7280)" id="Vector" />
                          </SocialLinksBackgroundImage>
                          <div className="content-stretch flex items-center justify-center p-[10px] relative shrink-0 size-[24px]" data-name="Social Links">
                            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Clip path group">
                              <div className="[grid-area:1_/_1] h-[17.219px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-0.89px] mask-size-[19px_19px] ml-0 mt-[4.69%] relative w-[19px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
                                  <g id="Group">
                                    <path d={svgPaths.p16308a80} fill="var(--fill-0, #6B7280)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                          <SocialLinksBackgroundImage>
                            <path d={svgPaths.p2f12fba0} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                          </SocialLinksBackgroundImage>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="font-['Figtree',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#9ca3af] text-[14px] text-nowrap">CHANGELOG: 12-16-25</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-[rgba(0,0,0,0.2)] h-[2468px] left-0 top-0 w-[1440px]" data-name="Overlay">
        <div className="absolute h-[200px] left-0 top-0 w-[220px]" />
      </div>
      <div className="absolute bg-white content-stretch flex flex-col gap-[20px] items-end left-[calc(50%+0.5px)] p-[24px] rounded-[26px] top-[calc(50%-0.32px)] translate-x-[-50%] translate-y-[-50%]" data-name="Pop Up Card">
        <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0 text-nowrap">
              <p className="font-['Figtree',sans-serif] font-normal leading-[normal] relative shrink-0 text-[20px] text-black">Project Title</p>
              <p className="font-['Figtree',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[#9ca3af] text-[16px]">•</p>
              <p className="font-['Figtree',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#9ca3af] text-[20px]">Year</p>
            </div>
            <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]" data-name="Close">
              <div className="overflow-clip relative shrink-0 size-[20px]" data-name="heroicons-mini/x-mark">
                <div className="absolute inset-1/4" data-name="Union">
                  <div className="absolute inset-0" style={{ "--fill-0": "rgba(75, 85, 99, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                      <path d={svgPaths.p1de9a600} fill="var(--fill-0, #4B5563)" id="Union" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="font-['Figtree',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6b7280] text-[16px] w-full">Description</p>
        </div>
        <div className="h-[615.86px] relative rounded-[15.637px] shrink-0 w-[1097px]">
          <BackgroundImage2 additionalClassNames="rounded-[15.637px]" />
        </div>
      </div>
    </div>
  );
}