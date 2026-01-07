export default function Action() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Action 3">
      <div className="content-stretch flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]" data-name="Action 3">
        <div className="bg-[#08f] content-stretch flex flex-col items-center justify-center relative rounded-[1000px] shrink-0 size-[70px]" data-name="Symbol">
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 size-[70px] text-[25px] text-center text-white tracking-[0.06px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[13px]">􀆅</p>
          </div>
        </div>
        <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          Saved
        </p>
      </div>
    </div>
  );
}