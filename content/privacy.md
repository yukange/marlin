# Privacy Policy

**Last Updated:** December 20, 2025

Welcome to **Marlin**. We are committed to protecting your privacy and ensuring you have full control over your data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and application.

## 1. Our "Local-First" & "Data Sovereignty" Principle

Marlin is built differently from traditional cloud note-taking apps. We adhere to a **Local-First** architecture:

*   **Your Notes:** Your content is stored locally on your device (using IndexedDB) and synchronized directly to your own private GitHub repository.
*   **No Access:** We **do not** store, read, or have access to the content of your notes. Your data never touches our servers in a readable format. It stays between your browser and GitHub.

## 2. Information We Collect

While we minimize data collection, we require specific information to provide the service:

### A. Account Information
When you sign in with GitHub, we temporarily access your:
*   **GitHub User ID & Username:** To identify your session and display your profile.
*   **Email Address:** To send you important service updates or license keys.

**Note:** We do not permanently store your GitHub account information on our servers. All authentication is handled directly through GitHub OAuth, and your session data is stored only in secure, encrypted cookies in your browser.

### B. Usage Data (Anonymous)
We may use privacy-focused analytics tools (such as Vercel Analytics) to collect anonymous usage data. This helps us understand how the app is performing (e.g., page load speeds, error rates) without identifying individual users.

### C. Cookies and Local Storage
We use local storage mechanisms to save your application preferences (e.g., theme settings) and to cache your data for offline access.

## 3. How We Handle Payments

We do not process payments or store credit card information directly. All payments are handled by our payment provider, **Creem**.

*   When you purchase a license, you provide your billing information directly to Creem.
*   We only receive a confirmation of your purchase and a License Key to activate your Pro features.
*   Please review [Creem's Privacy Policy](https://www.creem.io/privacy) for more details.

## 4. GitHub Permissions

To provide the Service, Marlin requires authorization to access certain GitHub resources. We request the following permissions:

*   **repo** – Full access to your repositories. Used to create and sync your dedicated Marlin repository (e.g., `*.marlin`) for storing notes.
*   **gist** – Access to create and manage Gists. Used for the "Share as Gist" feature.
*   **workflow** – Access to GitHub Actions workflows. Used to set up automated cleanup workflows in your Marlin repository.
*   **delete_repo** – Permission to delete repositories. Used only when you explicitly choose to delete a Space, which removes the corresponding Marlin repository.

**Security:** Your GitHub Access Token is stored securely in an encrypted session cookie and is only transmitted over HTTPS. It is used exclusively for GitHub API calls on your behalf.

## 5. Data Security

We take reasonable measures to protect your information:
*   **Encryption:** All communication between the app, our edge functions, and GitHub is encrypted via SSL/TLS.
*   **No Database Liability:** Since we do not host a database of your notes, the risk of a mass data breach of user content via Marlin is structurally eliminated.

## 6. Legal Basis for Processing (GDPR)

For users in the European Economic Area (EEA), we process your data based on:
*   **Contract Performance:** To provide the Service you have signed up for.
*   **Legitimate Interests:** To improve our Service and ensure security.
*   **Consent:** Where applicable, such as for optional analytics.

## 7. Your Rights

Since your notes are stored in your own GitHub repository, you have absolute control:
*   **Access & Portability:** You can view, export, or move your notes anytime directly via GitHub.
*   **Deletion:** You can delete your account by revoking Marlin's access in your GitHub settings and deleting the Marlin repository.
*   **GDPR Rights:** If you are in the EEA, you have the right to access, rectify, erase, restrict processing, and data portability. Contact us to exercise these rights.

## 8. Data Retention

*   **Account Data:** We do not permanently store your GitHub account information. Your session data is stored only in your browser.
*   **Notes:** Your notes are stored in your GitHub repository and are retained according to your own GitHub settings.
*   **License Data:** If you purchase a Pro license, we retain your license key and associated email for verification purposes.

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 10. Contact Us

If you have any questions about this Privacy Policy, please contact us at: **support@marlinnotes.com**