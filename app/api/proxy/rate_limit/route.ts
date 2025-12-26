import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Marlin-App",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub API error:", response.status, errorText);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      resources: { core: { limit: number; remaining: number; reset: number } };
    };

    // Only return core data to reduce transmission
    return NextResponse.json({
      limit: data.resources.core.limit,
      remaining: data.resources.core.remaining,
      reset: data.resources.core.reset,
    });
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch rate limit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
