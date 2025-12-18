import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { Octokit } from "octokit"

export async function POST(req: NextRequest) {
  const session = await auth()
  const token = session?.accessToken

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { content, title } = await req.json()
    
    if (!content) {
      return new NextResponse("Content is required", { status: 400 })
    }

    // Initialize Octokit with the user's token
    const octokit = new Octokit({ auth: token })

    const filename = title && title.endsWith('.md') ? title : `${title || 'note'}.md`

    const response = await octokit.rest.gists.create({
      description: 'Published via Marlin Notes',
      public: false, // Secret Gist
      files: {
        [filename]: {
          content,
        },
      },
    })

    return NextResponse.json({
      id: response.data.id,
      url: response.data.html_url,
    })
  } catch (error: any) {
    console.error("Gist creation failed:", error.response?.data || error.message || error)
    return new NextResponse(JSON.stringify(error.response?.data || { message: "Failed to create Gist" }), { 
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
