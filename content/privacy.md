# Privacy Policy

**Last Updated:** December 1, 2025

Welcome to **Marlin**. We are committed to protecting your privacy and ensuring you have full control over your data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and application.

## 1. Our "Local-First" & "Data Sovereignty" Principle

Marlin is built differently from traditional cloud note-taking apps. We adhere to a **Local-First** architecture:

*   **Your Notes:** Your content is stored locally on your device (using IndexedDB) and synchronized directly to your own private GitHub repository.
*   **No Access:** We **do not** store, read, or have access to the content of your notes. Your data never touches our servers in a readable format. It stays between your browser and GitHub.

## 2. Information We Collect

While we minimize data collection, we require specific information to provide the service:

### A. Account Information
When you sign in with GitHub, we collect your:
*   **GitHub User ID & Username:** To identify your account.
*   **Email Address:** To send you important service updates or license keys.

### B. Usage Data (Anonymous)
We may use privacy-focused analytics tools (such as Vercel Analytics) to collect anonymous usage data. This helps us understand how the app is performing (e.g., page load speeds, error rates) without identifying individual users.

### C. Cookies and Local Storage
We use local storage mechanisms to save your application preferences (e.g., theme settings) and to cache your data for offline access.

## 3. How We Handle Payments

We do not process payments or store credit card information directly. All payments are handled by our Merchant of Record, **Lemon Squeezy**.

*   When you purchase a license, you provide your billing information directly to Lemon Squeezy.
*   We only receive a confirmation of your purchase and a License Key to activate your Pro features.
*   Please review [Lemon Squeezy's Privacy Policy](https://www.lemonsqueezy.com/privacy) for more details.

## 4. GitHub Permissions

To sync your notes, Marlin requires authorization to access your GitHub repositories.
*   **Scope:** We request access to read and write to your repositories.
*   **Purpose:** This is strictly used to create a dedicated repository (e.g., `*.marlin`) for your notes and to push/pull updates triggered by you.
*   **Security:** Your GitHub Access Token is encrypted and stored securely. It is never exposed to the client-side browser code.

## 5. Data Security

We take reasonable measures to protect your information:
*   **Encryption:** All communication between the app, our edge functions, and GitHub is encrypted via SSL/TLS.
*   **No Database Liability:** Since we do not host a database of your notes, the risk of a mass data breach of user content via Marlin is structurally eliminated.

## 6. Your Rights

Since your notes are stored in your own GitHub repository, you have absolute control:
*   **Access & Portability:** You can view, export, or move your notes anytime directly via GitHub.
*   **Deletion:** You can delete your account by revoking Marlin's access in your GitHub settings and deleting the Marlin repository.

## 7. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

## 8. Contact Us

If you have any questions about this Privacy Policy, please contact us at: **support@marlinnotes.com**