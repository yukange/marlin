/**
 * Markdown Utilities (Utility Layer)
 * 
 * Responsibilities:
 * - Parse frontmatter from markdown files
 * - Serialize notes to markdown with frontmatter
 * - Pure functions with no side effects
 * 
 * Depends on:
 * - gray-matter (external library)
 */

import matter from 'gray-matter';
import type { Note } from '@/lib/client/db';

export interface ParsedNote {
  content: string; // Pure markdown content (frontmatter stripped)
  tags: string[];
  date: number;
  deleted?: boolean;
  deletedAt?: number;
  title?: string;
}

/**
 * Parse markdown file with frontmatter
 * 
 * Expected format:
 * ```markdown
 * ---
 * tags: [tag1, tag2]
 * date: 1700000000001
 * deleted: true
 * deletedAt: 1700000099999
 * title: My Note Title
 * ---
 * 
 * Note content here...
 * ```
 * 
 * @param raw - Raw markdown content with frontmatter
 * @returns Parsed note data
 */
export function parseNote(raw: string): ParsedNote {
  const { data, content } = matter(raw);
  
  return {
    content: content.trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: typeof data.date === 'number' ? data.date : Date.now(),
    deleted: typeof data.deleted === 'boolean' ? data.deleted : undefined,
    deletedAt: typeof data.deletedAt === 'number' ? data.deletedAt : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
  };
}

/**
 * Serialize note to markdown with frontmatter
 * 
 * Output format:
 * ```markdown
 * ---
 * tags: [tag1, tag2]
 * date: 1700000000001
 * deleted: true
 * deletedAt: 1700000099999
 * title: My Note Title
 * ---
 * 
 * Note content here...
 * ```
 * 
 * @param note - Note object from database
 * @returns Markdown string with frontmatter
 */
export function stringifyNote(
  note: Pick<Note, 'content' | 'tags' | 'date' | 'deleted' | 'deletedAt' | 'title'>
): string {
  const frontmatter: Record<string, any> = {
    tags: note.tags,
    date: note.date,
  };

  if (note.title) {
    frontmatter.title = note.title;
  }

  // Only include deleted fields if relevant to keep frontmatter clean
  if (note.deleted) {
    frontmatter.deleted = true;
    if (note.deletedAt) {
      frontmatter.deletedAt = note.deletedAt;
    }
  }
  
  return matter.stringify(note.content, frontmatter);
}

/**
 * Extract title from markdown content
 * 
 * If the first line starts with "# ", extract the text as title.
 * 
 * @param content - Markdown content
 * @returns Title string or undefined
 */
export function extractTitle(content: string): string | undefined {
  const firstLine = content.split('\n')[0];
  if (firstLine?.startsWith('# ')) {
    return firstLine.substring(2).trim();
  }
  return undefined;
}

/**
 * Extract hashtags from markdown content
 * 
 * Matches patterns like #tag, #work-note, #2024
 * Does NOT match #123 (pure numbers) or ##heading (markdown headings)
 * 
 * @param content - Markdown content
 * @returns Array of unique tags (without # prefix)
 */
export function extractHashtags(content: string): string[] {
  // Match #word patterns (excluding markdown headings)
  // Uses Unicode property escapes to support international characters (e.g. Chinese)
  // Matches: #tag, #Tag, #中文, #t-a-g, #_tag
  // Does NOT match: ##heading (because the char after # is # or space)
  const regex = /(?:^|\s)(#([\p{L}\p{N}_\-]+))/gu;
  const matches = content.matchAll(regex);
  
  const tags = new Set<string>();
  for (const match of matches) {
    tags.add(match[2]);
  }
  
  return Array.from(tags);
}

/**
 * Merge tags from frontmatter and hashtags in content
 * 
 * Useful when auto-detecting tags from content.
 * 
 * @param frontmatterTags - Tags from YAML frontmatter
 * @param content - Markdown content to scan for hashtags
 * @returns Deduplicated array of tags
 */
export function mergeTags(frontmatterTags: string[], content: string): string[] {
  const hashtagsFromContent = extractHashtags(content);
  const allTags = new Set([...frontmatterTags, ...hashtagsFromContent]);
  return Array.from(allTags).sort();
}
