import { NextRequest, NextResponse } from "next/server";

const BOT_UA =
  /(Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|LinkedInBot|WhatsApp|TelegramBot|SkypeUriPreview|Applebot|Pinterest|crawler|spider|bot)/i;

export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/library/") && pathname !== "/library") {
    const bookSlug = pathname.slice("/library/".length);
    return NextResponse.rewrite(
      new URL(`/api/book-preview?bookSlug=${encodeURIComponent(bookSlug)}`, request.url),
    );
  }

  if (pathname.startsWith("/project/library/full/")) {
    const bookSlug = pathname.slice("/project/library/full/".length);
    return NextResponse.rewrite(
      new URL(`/api/book-preview?bookSlug=${encodeURIComponent(bookSlug)}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:bookSlug+", "/project/library/full/:bookSlug+"],
};
