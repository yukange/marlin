import { octokit } from '@/lib/client/github-api'

export interface ShareResult {
  id: string
  url: string
  htmlUrl: string
}

/**
 * Publish a note as a Secret Gist
 * 
 * @param content - Markdown content of the note
 * @param title - Optional title for the file (e.g. note.md)
 * @returns Gist ID and URL
 */
export async function publishToGist(content: string, title: string = 'note.md'): Promise<ShareResult> {
  // Ensure filename has .md extension
  const filename = title.endsWith('.md') ? title : `${title}.md`

  const response = await octokit.rest.gists.create({
    description: 'Published via Marlin Notes',
    public: false, // Secret Gist
    files: {
      [filename]: {
        content,
      },
    },
  })

  if (!response.data.id) {
    throw new Error('Failed to create Gist')
  }

  if (!response.data.url || !response.data.html_url) {
    throw new Error('Gist created but missing URL information')
  }

  return {
    id: response.data.id,
    url: response.data.url,
    htmlUrl: response.data.html_url,
  }
}

/**
 * Get Gist content by ID
 * Used for server-side rendering of the shared page
 */
export async function getGistContent(id: string): Promise<string | null> {
  try {
    const response = await octokit.rest.gists.get({ gist_id: id })
    const files = response.data.files
    if (!files) return null

    // Return content of the first file found
    const firstFile = Object.values(files)[0]
    return firstFile?.content || null
  } catch (error) {
    console.error('Failed to fetch Gist:', error)
    return null
  }
}
