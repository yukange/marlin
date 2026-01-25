import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { Octokit } from "octokit";

import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Dynamically import libsodium-wrappers to avoid top-level initialization issues
    // and linting conflicts with require().
    const sodium = await import("libsodium-wrappers").then(
      (mod) => mod.default
    );
    const session = await auth();
    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    if (!process.env.AUTH_SECRET) {
      console.error("AUTH_SECRET is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // 1. Generate API Key
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const jwt = await new SignJWT({
      userId: session.user.id,
      scope: "ai-action",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .sign(secret);

    const apiKey = `sk-marlin-${jwt}`;

    // 2. GitHub Integration
    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // 3. Secret Encryption
    // Fetch the repo's public key
    const { data: publicKeyData } = await octokit.request(
      "GET /repos/{owner}/{repo}/actions/secrets/public-key",
      {
        owner,
        repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const keyId = publicKeyData.key_id;
    const publicKey = publicKeyData.key;

    // Encrypt the API Key
    await sodium.ready;
    const binkey = sodium.from_base64(
      publicKey,
      sodium.base64_variants.ORIGINAL
    );
    const binsec = sodium.from_string(apiKey);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const encryptedValue = sodium.to_base64(
      encBytes,
      sodium.base64_variants.ORIGINAL
    );

    // 4. Upload Secret
    await octokit.request(
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
      {
        owner,
        repo,
        secret_name: "MARLIN_API_KEY",
        encrypted_value: encryptedValue,
        key_id: keyId,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/ai/key:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
