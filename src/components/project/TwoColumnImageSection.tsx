import clsx from 'clsx';
import { PortableText } from '@portabletext/react';
import ShimmerImage from '../shared/ShimmerImage';
import { urlFor } from '../../sanity/client';
import type { TwoColumnImageSection } from '../../sanity/types';

interface TwoColumnImageSectionProps {
  section: TwoColumnImageSection;
  renderHighlightedText: (text: string, highlightedText?: string, highlightColor?: string) => React.ReactNode;
  portableTextComponents: any;
}

export function TwoColumnImageSectionComponent({ 
  section, 
  renderHighlightedText, 
  portableTextComponents 
}: TwoColumnImageSectionProps) {
  const twoColLeftImageSrc = section.leftImageUrl
    ? section.leftImageUrl
    : section.leftImage
      ? urlFor(section.leftImage).width(800).url()
      : null;

  const twoColRightImageSrc = section.rightImageUrl
    ? section.rightImageUrl
    : section.rightImage
      ? urlFor(section.rightImage).width(1200).url()
      : null;

  const twoColGapMap = {
    small: 'gap-12',    // 3rem / 48px
    medium: 'gap-16',   // 4rem / 64px
    large: 'gap-24',    // 5rem / 80px
  };
  const twoColImageGap = twoColGapMap[section.imageGap || 'medium'];

  // Size maps for both images (slightly reduced from 20/40/60)
  const imageSizeMap = {
    small: 'w-1/3',    // ~33%
    medium: 'w-5/12',  // ~42%
    large: 'w-7/12',   // ~58%
  };
  const leftImageWidth = imageSizeMap[section.leftImageSize || 'medium'];
  const rightImageWidth = imageSizeMap[section.rightImageSize || 'large'];

  // Text column gets remaining width after right image
  const textColumnWidthMap = {
    small: 'w-4/5',   // 100% - 20% = 80%
    medium: 'w-3/5',  // 100% - 40% = 60%
    large: 'w-2/5',   // 100% - 60% = 40%
  };
  const textColumnWidth = textColumnWidthMap[section.rightImageSize || 'large'];

  // Determine layout
  const isTextOnLeft = section.layout !== 'text-right';
  const isThreeColumn = section.layout === 'three-column';
  const isTwoImages = section.layout === 'two-images';

  return (
    <div
      className="content-stretch flex flex-col items-start justify-between px-8 py-16 relative shrink-0 w-full"
      style={{ backgroundColor: section.backgroundColor || 'transparent' }}
    >
      {/* Two Images Only Layout: Left Image | Right Image */}
      {isTwoImages ? (
        <div className={clsx(
          "flex flex-row w-full justify-center max-md:flex-col items-center",
          twoColImageGap
        )}>
          {/* Left Image */}
          {twoColLeftImageSrc && (
            <div 
              className="flex flex-col gap-3 w-full max-w-70"
              style={section.leftImageCustomWidth ? { maxWidth: section.leftImageCustomWidth } : undefined}
            >
              <div className={clsx(
                "overflow-hidden w-full flex items-center justify-center",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <ShimmerImage
                  rounded={section.rounded !== false ? "rounded-[26px]" : undefined}
                  className="w-full h-auto object-contain"
                  alt=""
                  src={twoColLeftImageSrc}
                />
              </div>
              {section.leftImageCaption && (
                <p className="text-sm text-center text-zinc-500">
                  {section.leftImageCaption}
                </p>
              )}
            </div>
          )}

          {/* Right Image */}
          {twoColRightImageSrc && (
            <div 
              className="flex flex-col gap-3 w-full max-w-70"
              style={section.rightImageCustomWidth ? { maxWidth: section.rightImageCustomWidth } : undefined}
            >
              <div className={clsx(
                "overflow-hidden w-full flex items-center justify-center max-md:h-auto",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <ShimmerImage
                  rounded={section.rounded !== false ? "rounded-[26px]" : undefined}
                  className="w-full h-auto object-contain"
                  alt=""
                  src={twoColRightImageSrc}
                />
              </div>
              {section.rightImageCaption && (
                <p className="text-sm text-center text-zinc-500">
                  {section.rightImageCaption}
                </p>
              )}
            </div>
          )}
        </div>
      ) : isThreeColumn ? (
        <div className={clsx(
          "flex w-full justify-center max-md:flex-col items-center gap-20",
          twoColImageGap
        )}>
          {/* Left Image */}
          {twoColLeftImageSrc && (
            <div className={clsx("flex flex-col gap-3", leftImageWidth)}>
              <div className={clsx(
                "overflow-hidden w-full flex items-center justify-center",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <ShimmerImage
                  rounded={section.rounded !== false ? "rounded-[26px]" : undefined}
                  className="w-full h-auto object-contain"
                  alt=""
                  src={twoColLeftImageSrc}
                />
              </div>
              {section.leftImageCaption && (
                <p className="text-sm text-center text-zinc-500">
                  {section.leftImageCaption}
                </p>
              )}
            </div>
          )}

          {/* Center Text Column */}
          <div className={clsx(textColumnWidth, "max-md:w-full shrink-0 flex flex-col justify-center gap-12")}>
            {/* Label and Heading */}
            {(section.label || section.heading) && (
              <div className="flex flex-col gap-3">
                {section.label && (
                  <p className="leading-normal uppercase text-[#a1a1aa] text-base">
                    {section.label}
                  </p>
                )}
                {section.heading && (
                  <h3 className="leading-normal text-2xl text-zinc-900 whitespace-pre-wrap">
                    {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                  </h3>
                )}
              </div>
            )}

            {/* Description */}
            {section.description && section.description.length > 0 && (
              <div className="leading-normal max-w-120 pb-1 text-[#52525b] text-base whitespace-pre-wrap prose prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
                <PortableText value={section.description} components={portableTextComponents} />
              </div>
            )}
          </div>

          {/* Right Image */}
          {twoColRightImageSrc && (
            <div className={clsx("flex flex-col gap-3", rightImageWidth)}>
              <div className={clsx(
                "overflow-hidden w-full flex items-center justify-center max-md:h-auto max-md:w-full",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <ShimmerImage
                  rounded={section.rounded !== false ? "rounded-[26px]" : undefined}
                  className="w-full h-auto object-contain"
                  alt=""
                  src={twoColRightImageSrc}
                />
              </div>
              {section.rightImageCaption && (
                <p className="text-sm text-center text-zinc-500">
                  {section.rightImageCaption}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Two Column Layout */
        <div className={clsx(
          "flex w-full justify-between max-md:flex-col gap-20 items-center",
          twoColImageGap,
          !isTextOnLeft && "flex-row-reverse"
        )}>
          {/* Text Column */}
          <div className={clsx(textColumnWidth, "max-md:w-full shrink-0 flex flex-col justify-center gap-12")}>
            {/* Label and Heading */}
            {(section.label || section.heading) && (
              <div className="flex flex-col gap-3">
                {section.label && (
                  <p className="leading-normal uppercase text-[#a1a1aa] text-base">
                    {section.label}
                  </p>
                )}
                {section.heading && (
                  <h3 className="leading-normal text-2xl text-zinc-900 whitespace-pre-wrap">
                    {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                  </h3>
                )}
              </div>
            )}

            {/* Description */}
            {section.description && section.description.length > 0 && (
              <div className="leading-normal pb-1 text-[#52525b] max-w-120 text-base whitespace-pre-wrap prose prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
                <PortableText value={section.description} components={portableTextComponents} />
              </div>
            )}

            {/* Left Image (in text column) */}
            {twoColLeftImageSrc && (
              <div className="flex flex-col gap-3 max-w-120 w-full">
                <div className={clsx(
                  "overflow-hidden w-full flex items-center justify-center",
                  section.rounded !== false && "rounded-[26px]"
                )}>
                  <ShimmerImage
                    rounded={section.rounded !== false ? "rounded-[26px]" : undefined}
                    className="w-full h-auto object-contain"
                    alt=""
                    src={twoColLeftImageSrc}
                  />
                </div>
                {section.leftImageCaption && (
                  <p className="text-sm text-center text-zinc-500">
                    {section.leftImageCaption}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Image Column */}
          {twoColRightImageSrc && (
            <div className={clsx("flex flex-col gap-3", rightImageWidth)}>
              <div className={clsx(
                "overflow-hidden w-full flex items-center justify-center max-md:h-auto max-md:w-full",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <ShimmerImage
                  rounded={section.rounded !== false ? "rounded-[26px]" : undefined}
                  className="w-full h-auto object-contain"
                  alt=""
                  src={twoColRightImageSrc}
                />
              </div>
              {section.rightImageCaption && (
                <p className="text-sm text-center text-zinc-500">
                  {section.rightImageCaption}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
