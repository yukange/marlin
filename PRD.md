# Product Requirements Document (PRD) - Marlin

| Document Details | |
| :--- | :--- |
| **Product Name** | Marlin |
| **Version** | 1.1.0 |
| **Status** | Active / Maintenance |
| **Last Updated** | 2025-01-07 |
| **Target Audience** | Developers, Technical Writers, Git Users |

---

## 1. Executive Summary
Marlin is a stream-based, local-first note-taking application designed specifically for developers who value speed, data ownership, and standard formats. Unlike traditional cloud note-taking apps that lock data into proprietary databases, Marlin treats the user's **GitHub private repository** as the backend storage. It combines the zero-latency experience of a local app (via IndexedDB) with the reliability and version control of Git.

## 2. Core Value Propositions
1.  **Speed (Local-First):** All interactions (reading, writing, searching) happen against a local IndexedDB, ensuring zero latency regardless of network status.
2.  **Data Ownership (No Lock-in):** Notes are stored as plain Markdown (`.md`) files in the user's own GitHub repositories.
3.  **Developer Experience:** Chat-like "Stream" interface, Markdown support, code highlighting, and keyboard-centric navigation.
4.  **Privacy:** No server-side storage of notes. Data flows directly between the Client (Browser) and GitHub (via a stateless proxy).

## 3. User Personas
*   **The Power User Developer:** Wants to own their data, loves Markdown, trusts GitHub, and hates waiting for spinners. Uses multiple devices and expects seamless sync.
*   **The Privacy Advocate:** Wary of SaaS pricing changes and privacy policies. Prefers "Bring Your Own Storage" (BYOS) models.

## 4. Functional Requirements

### 4.1 Authentication & Onboarding
*   **GitHub OAuth:** Users sign in using their GitHub account.
*   **Scope:** Requires `repo` scope to read/write private repositories.
*   **Session Management:** Secure, HTTP-only cookie sessions (via Auth.js).

### 4.2 Workspace (Space) Management
*   **Concept:** A "Space" corresponds to a GitHub repository named `{name}.marlin`.
*   **Create Space:** Users can create new spaces directly from the UI, which triggers repository creation on GitHub.
*   **Switch Space:** Quick switcher to toggle between different contexts (e.g., "work", "personal").
*   **Privacy:** All created repositories are private by default.

### 4.3 Note Taking (The Stream)
*   **Interface:** A linear, chat-like feed of notes (Stream view).
*   **Composer:**
    *   Rich-text editor based on Tiptap.
    *   Full Markdown support (headings, lists, code blocks, blockquotes).
    *   Slash commands (`/`) for quick formatting.
    *   Image uploads (via GitHub Gist or repository assets - *To Be Confirmed in implementation details*).
*   **Optimistic UI:** Notes appear instantly in the stream before syncing to GitHub.

### 4.4 Organization & Navigation
*   **Tags:** Hashtag support (e.g., `#idea`, `#todo`) within note content.
*   **Sidebar Navigation:** Filter notes by tags.
*   **Calendar/Heatmap:** Visual representation of contribution/note activity over time.
*   **Search:** Full-text search across all notes in the current space (executed locally).

### 4.5 Synchronization (Sync Engine)
*   **Background Sync:** Automatically syncs changes to GitHub.
*   **Polling/Push:** Checks for remote changes periodically or on focus.
*   **Conflict Resolution:** Last-write-wins (file level) or Append-only (stream nature). *Architecture relies on Git's blob/tree model.*
*   **Offline Mode:** Full read/write capability while offline. Queues changes to sync when online.

### 4.6 Monetization (Pro Features)
*   **Model:** Freemium with a "Pro" tier.
*   **License Check:** Integration with **Creem** for subscription validation.
*   **Pro Features:**
    *   Unlimited Spaces (Free tier limited).
    *   Advanced templates.
    *   Priority support.
*   **Feature Gating:** Client-side checks (`use-pro-gate.ts`) backed by server-side verification (`/api/license/check`).

## 5. Non-Functional Requirements

### 5.1 Performance
*   **Time to Interactive (TTI):** < 1s.
*   **Input Latency:** < 50ms (typing feels native).
*   **Search Speed:** < 100ms for < 10,000 notes.

### 5.2 Security & Privacy
*   **Token Storage:** GitHub Access Tokens are **never** stored in the database. They reside in encrypted HTTP-only cookies.
*   **Proxy Pattern:** All client requests to GitHub go through a stateless Edge Proxy to prevent token leakage.
*   **Encryption:** Communication with GitHub is always over HTTPS.

### 5.3 Reliability
*   **Data Integrity:** IndexedDB acts as the source of truth for the UI; GitHub acts as the backup/sync target.
*   **Error Handling:** Graceful degradation if GitHub API is down (app remains functional locally).

## 6. Technical Architecture

### 6.1 Tech Stack
*   **Frontend Framework:** Next.js 15 (App Router).
*   **Edge Runtime:** Cloudflare Workers (for API routes).
*   **Local Database:** Dexie.js (IndexedDB wrapper).
*   **Editor:** Tiptap (Prosemirror based).
*   **Styling:** Tailwind CSS v4 + shadcn/ui.
*   **Deployment:** Cloudflare Pages (via `@opennextjs/cloudflare`).

### 6.2 Data Model (Local Schema)
**Note Entity:**
```typescript
interface Note {
  id: string;        // Timestamp-based ID (filename)
  content: string;   // Markdown content
  tags: string[];    // Extracted tags
  date: number;      // Creation timestamp
  space: string;     // Workspace identifier
  sha?: string;      // Git blob SHA (for sync status)
  syncStatus: 'synced' | 'pending' | 'modified' | 'error';
}
```

**Space Entity:**
```typescript
interface Space {
  name: string;      // Display name
  repoName: string;  // GitHub repo name (*.marlin)
  updatedAt: number; // Last sync time
}
```

### 6.3 Data Flow
1.  **User Writes:** Content -> Tiptap -> IndexedDB (Optimistic Save).
2.  **Sync Trigger:** `use-sync` hook detects change -> API Proxy.
3.  **Proxy:** Decrypts session -> Adds GitHub Token -> Calls GitHub API.
4.  **GitHub:** Commits file to repo (`notes/timestamp.md`).
5.  **Reconciliation:** App updates local `sha` to match remote.

## 7. License
*   **Type:** Business Source License (BSL) 1.1.
*   **Terms:** Free for personal use. Commercial restrictions for competing SaaS services. Converts to MIT in 4 years.

## 8. Future Considerations (Roadmap)
*   **Mobile App:** PWA installation or Native wrapper.
*   **Collaboration:** Shared spaces for teams (requires conflict resolution strategy).
*   **Encryption:** Client-side encryption of note content before sending to GitHub.
