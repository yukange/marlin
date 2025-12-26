import { NextResponse } from "next/server";
import { Octokit } from "octokit";

import { auth } from "@/lib/auth";

import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { content, title } = (await req.json()) as {
      content?: string;
      title?: string;
    };

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    // Initialize Octokit with the user's token
    const octokit = new Octokit({ auth: token });

    const filename =
      title && title.endsWith(".md") ? title : `${title || "note"}.md`;

    const response = await octokit.rest.gists.create({
      description: "Published via Marlin Notes",
      public: false, // Secret Gist
      files: {
        [filename]: {
          content,
        },
      },
    });

    return NextResponse.json({
      id: response.data.id,
      url: response.data.html_url,
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: unknown };
      message?: string;
      status?: number;
    };
    console.error(
      "Gist creation failed:",
      err.response?.data || err.message || error
    );
    return new NextResponse(
      JSON.stringify(
        err.response?.data || { message: "Failed to create Gist" }
      ),
      {
        status: err.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
