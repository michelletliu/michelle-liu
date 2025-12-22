import React, { useState } from "react";
import clsx from "clsx";

// Lock icon SVG
const LockIcon = () => (
  <svg
    className="block size-full"
    viewBox="0 0 76 84"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M38 0C24.2 0 13 11.2 13 25V35H10C4.5 35 0 39.5 0 45V74C0 79.5 4.5 84 10 84H66C71.5 84 76 79.5 76 74V45C76 39.5 71.5 35 66 35H63V25C63 11.2 51.8 0 38 0ZM23 25C23 16.7 29.7 10 38 10C46.3 10 53 16.7 53 25V35H23V25ZM42 61.5V69H34V61.5C31.5 60.2 30 57.7 30 55C30 50.6 33.6 47 38 47C42.4 47 46 50.6 46 55C46 57.7 44.5 60.2 42 61.5Z"
      fill="#9CA3AF"
    />
  </svg>
);

// Arrow right icon SVG
const ArrowRightIcon = () => (
  <svg
    className="block size-full"
    viewBox="0 0 12 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 0C6.41421 0 6.75 0.335786 6.75 0.75V11.4393L10.7197 7.46967C11.0126 7.17678 11.4874 7.17678 11.7803 7.46967C12.0732 7.76256 12.0732 8.23744 11.7803 8.53033L6.53033 13.7803C6.23744 14.0732 5.76256 14.0732 5.46967 13.7803L0.21967 8.53033C-0.0732233 8.23744 -0.0732233 7.76256 0.21967 7.46967C0.512563 7.17678 0.987437 7.17678 1.28033 7.46967L5.25 11.4393V0.75C5.25 0.335786 5.58579 0 6 0Z"
      fill="#9CA3AF"
    />
  </svg>
);

type ProtectedContentProps = {
  type?: "Password" | "Email";
  device?: "Default" | "Mobile";
  /** Email address for contact link */
  email?: string;
  /** Callback when password is submitted */
  onPasswordSubmit?: (password: string) => void;
};

export default function ProtectedContent({
  type = "Password",
  device = "Default",
  email = "michelletheresaliu@gmail.com",
  onPasswordSubmit,
}: ProtectedContentProps) {
  const [passwordValue, setPasswordValue] = useState("");
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";
  const isPassword = type === "Password";
  const isEmail = type === "Email";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPasswordSubmit?.(passwordValue);
  };

  return (
    <div
      className={clsx(
        "content-stretch flex flex-col items-start py-16 relative",
        isDesktop && "px-[175px] w-[1440px]",
        isMobile && "px-8 w-[640px]"
      )}
    >
      <div className="bg-[#f9fafb] content-stretch flex flex-col items-center justify-center overflow-clip p-16 relative rounded-[26px] shrink-0 w-full">
        <div
          className={clsx(
            "content-stretch flex flex-col items-start relative shrink-0",
            isPassword && "gap-8",
            isDesktop && "w-[868px]",
            isMobile && "w-full"
          )}
        >
          <div className="content-stretch flex flex-col gap-8 items-start justify-center relative shrink-0">
            {/* Lock Icon */}
            <div className="relative shrink-0 size-[60px]">
              <div className="absolute inset-[-10%_-13.33%_-16.67%_-13.33%]">
                <LockIcon />
              </div>
            </div>

            {/* Text Content */}
            <div className="content-stretch flex flex-col gap-2 items-start opacity-60 relative shrink-0 w-[424px] whitespace-pre-wrap">
              <p className="leading-7 relative shrink-0 text-2xl text-black w-full">
                {isPassword ? "This case study is password protected." : "Confidential"}
              </p>
              <p className="leading-6 relative shrink-0 text-[#6b7280] text-xl">
                {isPassword ? (
                  <>
                    Curious? Feel free to{" "}
                    <a
                      href={`mailto:${email}`}
                      className="underline decoration-solid hover:text-blue-500 transition-colors"
                    >
                      email me
                    </a>
                    !
                  </>
                ) : (
                  <>
                    Interested? Please{" "}
                    <a
                      href={`mailto:${email}`}
                      className="underline decoration-solid hover:text-blue-500 transition-colors"
                    >
                      email me
                    </a>
                    !
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Password Input (Password type only) */}
          {isPassword && (
            <form onSubmit={handleSubmit} className="w-[313px]">
              <div className="bg-white border border-[#f3f4f6] border-solid content-stretch flex items-center justify-between pl-4 pr-3 py-2 relative rounded-full shrink-0 w-full">
                <input
                  type="password"
                  placeholder="Enter"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="leading-5 relative shrink-0 text-[#9ca3af] text-base bg-transparent border-none outline-none flex-1 placeholder:text-[#9ca3af]"
                />
                <button
                  type="submit"
                  className="relative shrink-0 size-5 rotate-[-90deg] hover:opacity-70 transition-opacity"
                >
                  <ArrowRightIcon />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
