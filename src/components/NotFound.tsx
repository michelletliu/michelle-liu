"use client";

export default function NotFound() {
  return (
    <div className="min-h-dvh w-full bg-white flex flex-col items-center justify-center px-8">
      {/* Logo is rendered globally by PersistentLogo in Providers */}

      {/* Content */}
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="font-['SF_Pro:Regular',sans-serif] text-[80px] md:text-[120px] leading-none text-gray-200">
          404
        </p>
        <div className="flex flex-col gap-1">
          <p className="font-['Michelle',sans-serif] text-lg text-gray-400">
            Oh no!
          </p>
          <p className="font-['Michelle',sans-serif] text-lg text-gray-400">
            Please <a href="mailto:studio@liumichelle.com" className="text-gray-600 font-medium hover:text-blue-500 transition-colors duration-200">email me</a> if there was an error :')
          </p>
        </div>
      </div>
    </div>
  );
}
