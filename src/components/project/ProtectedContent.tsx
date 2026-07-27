import React, { useState } from "react";
import clsx from "clsx";
import lockIcon from "../../assets/lock.svg";
import { FieldInput, FieldShell, fieldIconSlotClassName } from "../FieldInput";
import { ArrowRightIcon } from "../Arrow";
import { INLINE_LINK_CLASS } from "../inlineLink";

// Lock icon with circular background and shadow (matches Figma exactly)
const LockIcon = () => (
  <div className="relative shrink-0 size-[60px]">
    {/* Circle with subtle shadow */}
    <div className="absolute inset-0 rounded-full bg-white shadow-soft flex items-center justify-center">
      <img src={lockIcon} alt="" className="w-[19px] h-[28px]" />
    </div>
  </div>
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
  email = "studio@liumichelle.com",
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
        "bg-zinc-200 content-stretch flex flex-col items-center justify-center overflow-clip px-16 relative rounded-[26px] shrink-0 w-full",
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
              <p className="leading-7 relative shrink-0 text-2xl text-zinc-900">
                {isPassword ? "This case study is password-protected." : "Confidential"}
              </p>
              <p className="leading-6 relative shrink-0 text-[#71717a] text-lg">
                {projectSlug === "apple" ? (
                  <>
                    Please{" "}
                    <a
                      href={`mailto:${email}`}
                      className={INLINE_LINK_CLASS}
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
                      className={INLINE_LINK_CLASS}
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
                      className={INLINE_LINK_CLASS}
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
              <FieldShell error={error} className="justify-between">
                <FieldInput
                  type="password"
                  placeholder="Enter"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
                <button
                  type="submit"
                  className={clsx(
                    fieldIconSlotClassName,
                    "relative text-zinc-400 transition-opacity hover:opacity-70",
                  )}
                  aria-label="Submit password"
                >
                  <ArrowRightIcon size="14px" />
                </button>
              </FieldShell>
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



