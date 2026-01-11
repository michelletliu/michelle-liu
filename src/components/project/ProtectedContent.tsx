import React, { useState } from "react";
import clsx from "clsx";
import lockIcon from "../../assets/lock.svg";

// Lock icon with circular background and shadow (matches Figma exactly)
const LockIcon = () => (
  <div className="relative shrink-0 size-[60px]">
    {/* Circle with subtle shadow */}
    <div className="absolute inset-0 rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08)] flex items-center justify-center">
      <img src={lockIcon} alt="" className="w-[19px] h-[28px]" />
    </div>
  </div>
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
  /** Whether a password is set in Sanity - controls if password input is shown */
  hasPassword?: boolean;
  /** Callback when password is submitted */
  onPasswordSubmit?: (password: string) => void;
  /** Whether to show error state */
  error?: boolean;
  /** Project slug for custom messaging */
  projectSlug?: string;
};

export default function ProtectedContent({
  type = "Password",
  device = "Default",
  email = "michelletheresaliu@gmail.com",
  hasPassword = false,
  onPasswordSubmit,
  error = false,
  projectSlug,
}: ProtectedContentProps) {
  const [passwordValue, setPasswordValue] = useState("");
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";
  const isPassword = type === "Password";
  const isEmail = type === "Email";
  const showPasswordInput = hasPassword;

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
      <div className={clsx(
        "bg-gray-200 content-stretch flex flex-col items-center justify-center overflow-clip px-16 relative rounded-[26px] shrink-0 w-full",
        isMobile ? "py-32" : "py-16"
      )}>
        <div
          className={clsx(
            "content-stretch flex flex-col items-start relative shrink-0",
            showPasswordInput && "gap-8",
            isDesktop && "w-full",
            isMobile && "w-full"
          )}
        >
          <div className="content-stretch flex flex-col gap-8 items-start justify-center relative shrink-0">
            {/* Lock Icon */}
            <LockIcon />

            {/* Text Content */}
            <div className="content-stretch flex flex-col gap-2 items-start opacity-60 relative shrink-0 w-full">
              <p className="leading-7 relative shrink-0 text-2xl text-black">
                {isPassword ? "This case study is password-protected." : "Confidential"}
              </p>
              <p className="leading-6 relative shrink-0 text-[#6b7280] text-lg">
                {projectSlug === "apple" ? (
                  <>
                    Please{" "}
                    <a
                      href={`mailto:${email}`}
                      className="underline decoration-solid hover:text-blue-500 transition-colors"
                    >
                      email me
                    </a>
                    {" "}if you'd like to chat!
                  </>
                ) : isPassword ? (
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

          {/* Password Input - shown when hasPassword is true (password is set in Sanity) */}
          {showPasswordInput && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-[313px]">
              <div 
                className={clsx(
                  "bg-white border border-solid content-stretch flex items-center justify-between pl-4 pr-3 py-2 relative rounded-full shrink-0 w-full transition-colors duration-200",
                  error ? "border-[#f87171]" : "border-[#e5e7eb]"
                )}
              >
                <input
                  type="password"
                  placeholder="Enter"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="leading-5 relative shrink-0 text-[#9ca3af] text-base bg-transparent border-none outline-none flex-1 placeholder:text-[#9ca3af]"
                />
                <button
                  type="submit"
                  className="relative shrink-0 size-[14px] rotate-[-90deg] hover:opacity-70 transition-opacity"
                >
                  <ArrowRightIcon />
                </button>
              </div>
              {/* Error Message with smooth animation */}
              <div 
                className={clsx(
                  "overflow-hidden transition-all duration-300 ease-out",
                  error ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="text-[#f87171] text-sm leading-5 px-2">
                  Please try again!
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}



