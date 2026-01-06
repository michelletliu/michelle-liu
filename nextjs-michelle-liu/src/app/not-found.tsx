import Link from "next/link";
import ErrorMessage from "@/components/ErrorMessage";

export default function NotFound() {
  return (
    <ErrorMessage
      title="Oops ... this page can't be found!"
      description={
        <>
          Feel free to return{" "}
          <Link
            href="/"
            className="underline decoration-slate-200 underline-offset-4 transition-colors text-[#111827] hover:text-[#111827]"
          >
            home.
          </Link>
        </>
      }
    />
  );
}
