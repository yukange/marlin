import { NextResponse } from "next/server";
import { Octokit } from "octokit";

import { auth } from "@/lib/auth";

import type { NextRequest } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { content, filename, space, userLogin } = (await req.json()) as {
      content?: string;
      filename?: string;
      space?: string;
      userLogin?: string;
    };

    if (!content || !filename || !space || !userLogin) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate content size (base64 encoded, so actual file is ~75% of this)
    const estimatedSize = (content.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return new NextResponse("File too large. Maximum size is 5MB.", {
        status: 413,
      });
    }

    // Initialize Octokit with the user's token
    const octokit = new Octokit({ auth: token });

    // Construct repo name with .marlin suffix
    const repoName = space.endsWith(".marlin") ? space : `${space}.marlin`;
    const path = `images/${filename}`;

    // Upload to GitHub
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner: userLogin,
      repo: repoName,
      path,
      message: `Add image ${filename}`,
      content, // Already base64 encoded
    });

    // Use proxy URL for private repo support
    // Format: /api/proxy/image/[owner]/[repo]/[path]
    const proxyUrl = `/api/proxy/image/${userLogin}/${repoName}/${path}`;

    return NextResponse.json({
      url: proxyUrl,
      sha: response.data.content?.sha,
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: unknown };
      message?: string;
      status?: number;
    };
    console.error(
      "Image upload failed:",
      err.response?.data || err.message || error
    );
    return new NextResponse(
      JSON.stringify(
        err.response?.data || { message: "Failed to upload image" }
      ),
      {
        status: err.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
