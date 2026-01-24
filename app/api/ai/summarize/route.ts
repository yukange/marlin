import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

import { generateSummary } from "@/lib/services/ai-service";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Check for AUTH_SECRET
    if (!process.env.AUTH_SECRET) {
      console.error("AUTH_SECRET is not defined");
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

    try {
      const { payload } = await jwtVerify(token, secret);

      if (payload.scope !== "ai-action") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notes, instruction } = body;

    const summary = await generateSummary(notes, instruction);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI Summarize Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
