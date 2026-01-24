export const SUMMARY_SCRIPT_CONTENT = `import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import matter from 'gray-matter';

const { values } = parseArgs({
  options: {
    tags: { type: 'string' },
    period: { type: 'string' },
    key: { type: 'string' },
    'api-url': { type: 'string' },
  },
});

const { tags, period, key, 'api-url': apiUrl } = values;

if (!tags || !period || !key || !apiUrl) {
  console.error('Missing required arguments: --tags, --period, --key, --api-url');
  process.exit(1);
}

const targetTags = tags.split(',').map(t => t.trim());
const NOTES_DIR = 'notes';

// Calculate cutoff date
const now = new Date();
let cutoff = new Date();
if (period === 'day') cutoff.setDate(now.getDate() - 1);
else if (period === 'week') cutoff.setDate(now.getDate() - 7);
else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
else {
  console.error('Invalid period. Use day, week, or month.');
  process.exit(1);
}

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

async function main() {
  if (!fs.existsSync(NOTES_DIR)) {
    console.log('No notes directory found.');
    return;
  }

  const allFiles = getFiles(NOTES_DIR);
  const relevantNotes = [];

  for (const file of allFiles) {
    if (!file.endsWith('.md')) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const parsed = matter(content);
    const fileTags = parsed.data.tags || [];
    
    const hasTag = fileTags.some(t => targetTags.includes(t));
    if (!hasTag) continue;

    const fileDate = parsed.data.date ? new Date(parsed.data.date) : fs.statSync(file).mtime;
    if (fileDate < cutoff) continue;

    relevantNotes.push({
      content: parsed.content,
      date: fileDate.toISOString(),
      tags: fileTags
    });
  }

  if (relevantNotes.length === 0) {
    console.log('No relevant notes found for summary.');
    return;
  }

  console.log(\`Found \${relevantNotes.length} notes to summarize.\`);

  try {
    const response = await fetch(\`\${apiUrl}/api/ai/summarize\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${key}\`
      },
      body: JSON.stringify({ notes: relevantNotes })
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
    }

    const data = await response.json();
    const summaryText = data.summary; // Assuming API returns { summary: "..." }

    if (!summaryText) {
      throw new Error('No summary returned from API');
    }

    const summaryDate = now.toISOString().split('T')[0];
    const summaryDir = path.join(NOTES_DIR, 'Summary');
    if (!fs.existsSync(summaryDir)) {
      fs.mkdirSync(summaryDir, { recursive: true });
    }

    const summaryFile = path.join(summaryDir, \`Summary \${summaryDate}.md\`);
    const frontmatter = {
      type: 'summary',
      tags: ['ai-summary', ...targetTags],
      date: now.toISOString()
    };

    const fileContent = matter.stringify(summaryText, frontmatter);
    fs.writeFileSync(summaryFile, fileContent);
    console.log(\`Summary written to \${summaryFile}\`);

  } catch (error) {
    console.error('Failed to generate summary:', error);
    process.exit(1);
  }
}

main();
`;
