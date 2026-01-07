import clsx from "clsx";

type HomeIndicatorProps = {
  additionalClassNames?: string;
};

export function HomeIndicator({ additionalClassNames = "" }: HomeIndicatorProps) {
  return (
    <div className={clsx("md:hidden absolute h-[34px] left-1/2 translate-x-[-50%] w-[400px] max-w-full", additionalClassNames)}>
      <div className="absolute bottom-[8px] flex h-[5px] items-center justify-center left-1/2 translate-x-[-50%] w-[144px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="bg-black h-[5px] rounded-[100px] w-[144px]" data-name="Home Indicator" />
        </div>
      </div>
    </div>
  );
}