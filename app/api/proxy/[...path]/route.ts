import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import type { NextRequest } from "next/server";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "cookie",
];

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { path } = await params;
  const url = `https://api.github.com/${path.join("/")}`;
  const searchParams = req.nextUrl.searchParams.toString();
  const finalUrl = searchParams ? `${url}?${searchParams}` : url;

  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/vnd.github.v3+json");
  headers.set("User-Agent", "Marlin-App");

  // Clean up headers that shouldn't be forwarded
  HOP_BY_HOP_HEADERS.forEach((h) => headers.delete(h));

  const body = req.method !== "GET" && req.method !== "HEAD" ? req.body : null;

  try {
    const res = await fetch(finalUrl, {
      method: req.method,
      headers,
      body,
      // @ts-expect-error duplex is needed for streaming bodies
      duplex: "half",
    });

    const responseHeaders = new Headers(res.headers);
    HOP_BY_HOP_HEADERS.forEach((h) => responseHeaders.delete(h));
    responseHeaders.delete("content-encoding");

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
