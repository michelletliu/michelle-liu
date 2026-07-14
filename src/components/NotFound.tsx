"use client";

import { Link } from "@/lib/navigation";
import imgLogo from "../assets/logo.png";

export default function NotFound() {
  return (
    <div className="min-h-dvh w-full bg-white flex flex-col items-center justify-center px-8">
      {/* Logo */}
      <Link to="/" className="absolute top-8 left-8 md:left-16">
        <img
          src={imgLogo}
          alt="Michelle Liu Logo"
          className="size-8 md:size-[44px] object-contain transition-opacity duration-200 hover:opacity-80"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="font-['SF_Pro:Regular',sans-serif] text-7xl md:text-9xl leading-none text-zinc-200">
          404
        </p>
        <div className="flex flex-col gap-1">
          <p className="font-['Michelle',sans-serif] text-lg text-zinc-400">
            Oh no!
          </p>
          <p className="font-['Michelle',sans-serif] text-lg text-zinc-400">
            Please <a href="mailto:studio@liumichelle.com" className="text-zinc-600 font-medium hover:text-blue-500 transition-colors duration-200">email me</a> if there was an error :')
          </p>
        </div>
      </div>
    </div>
  );
}
