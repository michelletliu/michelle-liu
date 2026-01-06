import Link from "next/link";

type ErrorMessageProps = {
  title?: string;
  description?: React.ReactNode;
  footerHeading?: string;
  footerBody?: string;
};

const DEFAULT_TITLE = "Oops ... looks like something went wrong!";
const DEFAULT_DESCRIPTION = (
  <>
    Feel free to return{" "}
    <Link
      href="/"
      className="underline decoration-slate-200 underline-offset-4 transition-colors text-[#111827] hover:text-[#111827]"
    >
      home.
    </Link>
  </>
);
const DEFAULT_FOOTER_HEADING = "But if you’d like to stay a minute...";
const DEFAULT_FOOTER_BODY =
  "Here are collections I’ve made (↗) and links I like (✨). Enjoy!";

export default function ErrorMessage({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  footerHeading = DEFAULT_FOOTER_HEADING,
  footerBody = DEFAULT_FOOTER_BODY,
}: ErrorMessageProps) {
  return (
    <div className="min-h-screen w-full bg-[#f6f7fb] px-6 py-16 flex flex-col items-center justify-start gap-8 text-center">
      <div className="w-full max-w-2xl rounded-[36px] border border-[#e5e7eb] bg-white px-10 py-12 shadow-[0px_10px_30px_rgba(15,23,42,0.08)]">
        <div className="text-[64px] leading-none">😯</div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#0f172a]">
          {title}
        </h1>
        <p className="mt-3 text-base text-[#6b7280]">{description}</p>
      </div>

      <div className="max-w-2xl text-center text-[#111827]">
        <p className="text-lg font-semibold">{footerHeading}</p>
        <p className="mt-1 text-base text-[#4b5563]">{footerBody}</p>
      </div>
    </div>
  );
}
