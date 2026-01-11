import clsx from 'clsx';
import { PortableText } from '@portabletext/react';
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
    large: 'gap-20',    // 5rem / 80px
  };
  const twoColImageGap = twoColGapMap[section.imageGap || 'medium'];

  // Size maps for both images (20%, 40%, 60%)
  const imageSizeMap = {
    small: 'w-1/5',   // 20%
    medium: 'w-2/5',  // 40%
    large: 'w-3/5',   // 60%
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
      className="content-stretch flex flex-col items-start justify-between px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full"
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
            <div className="flex flex-col gap-3">
              <div className={clsx(
                "overflow-hidden h-60 flex items-center justify-center",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <img
                  className={clsx(
                    "max-w-full max-h-full object-contain",
                    section.rounded !== false && "rounded-[26px]"
                  )}
                  alt=""
                  src={twoColLeftImageSrc}
                />
              </div>
              {section.leftImageCaption && (
                <p className="text-sm text-center text-gray-500">
                  {section.leftImageCaption}
                </p>
              )}
            </div>
          )}

          {/* Right Image */}
          {twoColRightImageSrc && (
            <div className="flex flex-col gap-3">
              <div className={clsx(
                "overflow-hidden h-60 flex items-center justify-center max-md:h-auto",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <img
                  className={clsx(
                    "max-w-full max-h-full object-contain",
                    section.rounded !== false && "rounded-[26px]"
                  )}
                  alt=""
                  src={twoColRightImageSrc}
                />
              </div>
              {section.rightImageCaption && (
                <p className="text-sm text-center text-gray-500">
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
                "overflow-hidden w-full h-60 flex items-center justify-center",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <img
                  className="max-w-full max-h-full object-contain"
                  alt=""
                  src={twoColLeftImageSrc}
                />
              </div>
              {section.leftImageCaption && (
                <p className="text-sm text-center text-gray-500">
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
                  <p className="leading-5 uppercase text-[#9ca3af] text-base">
                    {section.label}
                  </p>
                )}
                {section.heading && (
                  <h3 className="leading-normal text-2xl text-black whitespace-pre-wrap">
                    {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                  </h3>
                )}
              </div>
            )}

            {/* Description */}
            {section.description && section.description.length > 0 && (
              <div className="leading-normal pb-1 text-[#4b5563] text-base whitespace-pre-wrap prose prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
                <PortableText value={section.description} components={portableTextComponents} />
              </div>
            )}
          </div>

          {/* Right Image */}
          {twoColRightImageSrc && (
            <div className={clsx("flex flex-col gap-3", rightImageWidth)}>
              <div className={clsx(
                "overflow-hidden w-full h-60 flex items-center justify-center max-md:h-auto max-md:w-full",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <img
                  className="max-w-full max-h-full object-contain"
                  alt=""
                  src={twoColRightImageSrc}
                />
              </div>
              {section.rightImageCaption && (
                <p className="text-sm text-center text-gray-500">
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
                  <p className="leading-5 uppercase text-[#9ca3af] text-base">
                    {section.label}
                  </p>
                )}
                {section.heading && (
                  <h3 className="leading-normal text-2xl text-black whitespace-pre-wrap">
                    {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                  </h3>
                )}
              </div>
            )}

            {/* Description */}
            {section.description && section.description.length > 0 && (
              <div className="leading-normal pb-1 text-[#4b5563] text-base whitespace-pre-wrap prose prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
                <PortableText value={section.description} components={portableTextComponents} />
              </div>
            )}

            {/* Left Image (in text column) */}
            {twoColLeftImageSrc && (
              <div className="flex flex-col gap-3 w-full">
                <div className={clsx(
                  "overflow-hidden w-full h-60",
                  section.rounded !== false && "rounded-[26px]"
                )}>
                  <img
                    className="w-full h-full object-cover"
                    alt=""
                    src={twoColLeftImageSrc}
                  />
                </div>
                {section.leftImageCaption && (
                  <p className="text-sm text-center text-gray-500">
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
                "overflow-hidden w-full h-60 justify-center max-md:h-auto max-md:w-full",
                section.rounded !== false && "rounded-[26px]"
              )}>
                <img
                  className="w-full h-full object-cover object-top"
                  alt=""
                  src={twoColRightImageSrc}
                />
              </div>
              {section.rightImageCaption && (
                <p className="text-sm text-center text-gray-500">
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
