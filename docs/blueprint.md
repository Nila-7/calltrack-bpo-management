# **App Name**: IntelliSecureX

## Core Features:

- User Authentication & Roles: Secure login system with distinct 'Admin' and 'User' roles, utilizing Firebase Authentication and redirecting to the appropriate dashboard post-login.
- Document Management (User Dashboard): Empowers users to upload, view, and securely delete documents in TXT, PDF, or DOCX formats, stored efficiently using Firebase Storage.
- Rule-Based Entity Detection: An internal module, `entityDetector.ts`, to detect sensitive information (e.g., PAN, Aadhaar, Email) within documents using regex patterns and keyword matching.
- Decoy Content Generation: The `decoyGenerator.ts` module replaces detected sensitive entities with pre-defined decoy values, reconstructs the document text, and preserves its original formatting.
- Interactive Document Viewer: A dedicated page where users can view documents, toggle between original and decoy versions, and analyze classified entities (entity type, original value, decoy, confidence).
- Admin Activity Monitoring: An Admin Dashboard displaying key metrics like total users, document statistics, decoy activations, unauthorized attempts, and a detailed, searchable activity log from Firestore.
- Suspicious Access Simulation: A feature to simulate a 'Suspicious Access' event, which automatically switches the document view to its decoy version and displays an alert banner.

## Style Guidelines:

- Primary color: A deep, professional blue (#2F6FED) evoking trust and security for key interactive elements.
- Background color: A very light, subtle blue (#F2F4F7) providing a clean, expansive canvas suitable for a corporate dashboard, derived from the primary hue.
- Secondary color: A darker shade of blue (#1E3A8A) used for subheadings or deeper interactive states, providing depth.
- Accent color: A vibrant sky blue (#60A5FA) for calls-to-action and important highlights, drawing immediate attention.
- Body and headline font: 'Inter' (sans-serif), chosen for its modern, clear, and objective aesthetic, enhancing readability across various data displays.
- Utilize professional, security-themed icons that align with a clean enterprise dashboard style, providing intuitive visual cues for actions and status.
- A responsive enterprise dashboard layout featuring minimal cards, soft shadows for visual hierarchy, and a clear, structured content presentation.
- Subtle, smooth transitions for document toggles, content loading, and dashboard updates to create a polished and modern user experience.