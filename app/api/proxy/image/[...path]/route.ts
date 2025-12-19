import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { Octokit } from "octokit"

/**
 * Proxy endpoint to serve images from private GitHub repos
 * 
 * Usage: /api/proxy/image/[owner]/[repo]/[...path]
 * Example: /api/proxy/image/yukange/work.marlin/images/123456.png
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const session = await auth()
    const token = session?.accessToken

    if (!token) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { path } = await params

        // Path format: [owner, repo, ...filePath]
        if (path.length < 3) {
            return new NextResponse("Invalid path", { status: 400 })
        }

        const [owner, repo, ...filePath] = path
        const imagePath = filePath.join('/')

        const octokit = new Octokit({ auth: token })

        // Fetch file content from GitHub
        const response = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: imagePath,
        })

        // Handle file response (not directory)
        const data = response.data
        if (Array.isArray(data) || data.type !== 'file' || !('content' in data)) {
            return new NextResponse("Not a file", { status: 400 })
        }

        // Decode base64 content
        const content = Buffer.from(data.content, 'base64')

        // Determine content type from file extension
        const ext = imagePath.split('.').pop()?.toLowerCase() || 'png'
        const contentTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'avif': 'image/avif',
        }
        const contentType = contentTypes[ext] || 'application/octet-stream'

        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
            },
        })
    } catch (error: any) {
        console.error("Image fetch failed:", error.response?.data || error.message || error)
        return new NextResponse("Failed to fetch image", { status: error.status || 500 })
    }
}
