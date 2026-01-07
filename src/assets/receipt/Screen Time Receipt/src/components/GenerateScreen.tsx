type GenerateScreenProps = {
  period: 'daily' | 'weekly';
  onPeriodChange: (period: 'daily' | 'weekly') => void;
  onGenerate: () => void;
  onUploadClick: () => void;
};

export function GenerateScreen({ period, onPeriodChange, onGenerate, onUploadClick }: GenerateScreenProps) {
  return (
    <div className="absolute bg-white content-stretch flex flex-col gap-[24px] items-center left-[calc(50%+0.5px)] px-[48px] py-[32px] rounded-[26px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%] max-w-[90%]">
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
          <button
            onClick={() => onPeriodChange('daily')}
            className="basis-0 grow h-full min-h-px min-w-px relative rounded-[7px] shrink-0 cursor-pointer"
            data-name="Button 1"
          >
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center px-[10px] py-[2px] relative size-full">
                {period === 'daily' && (
                  <div className="absolute bg-white inset-[0_-4.5px_0_-4px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]" data-name="Button" />
                )}
                <p className={`basis-0 font-['SF_Pro:${period === 'daily' ? 'Semibold' : 'Medium'}',sans-serif] font-[${period === 'daily' ? '590' : '510'}] grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap tracking-[-0.08px]`} style={{ fontVariationSettings: "'wdth' 100" }}>
                  Daily
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => onPeriodChange('weekly')}
            className="basis-0 grow h-full min-h-px min-w-px relative shrink-0 cursor-pointer"
            data-name="Button 2"
          >
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center px-[10px] py-[3px] relative size-full">
                {period === 'weekly' && (
                  <div className="absolute bg-white inset-[0_-4.5px_0_-4px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]" data-name="Button" />
                )}
                <p className={`basis-0 font-['SF_Pro:${period === 'weekly' ? 'Semibold' : 'Medium'}',sans-serif] font-[${period === 'weekly' ? '590' : '510'}] grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap tracking-[-0.08px]`} style={{ fontVariationSettings: "'wdth' 100" }}>
                  Weekly
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
      <button
        onClick={onGenerate}
        className="bg-[#404040] content-stretch flex items-center justify-center px-[20px] py-[10px] relative rounded-[999px] shrink-0 cursor-pointer hover:bg-[#333] transition-colors w-full"
        data-name="Button"
      >
        <p className="font-['SF_Mono:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[15px] text-center text-nowrap text-white tracking-[0.75px]">GENERATE</p>
      </button>
      
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgba(0,0,0,0.1)]"></div>
        </div>
        <div className="relative flex justify-center text-[11px]">
          <span className="bg-white px-2 text-[rgba(0,0,0,0.4)] font-['SF_Mono:Regular',sans-serif]">OR</span>
        </div>
      </div>

      <button
        onClick={onUploadClick}
        className="bg-white content-stretch flex items-center justify-center px-[20px] py-[10px] relative rounded-[999px] shrink-0 cursor-pointer hover:bg-gray-300 transition-colors w-full"
      >
        <p className="font-['SF_Mono:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[15px] text-center text-nowrap text-[#404040] tracking-[0.75px]">UPLOAD YOUR DATA</p>
      </button>
    </div>
  );
}