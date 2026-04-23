# Implementation Plan: Site Polish & Conversion Simplification (P1/P2)

## Objective
Refine the Kharon marketing site to align with the new commercial brand voice, simplify user conversion paths, and ensure high-quality visual standards across all devices.

## Key Files & Context
- `apps/site/src/components/Layout.tsx`: Main navigation and shell.
- `apps/site/src/pages/Home.tsx`: Homepage with quick-path jump points.
- `apps/site/src/pages/ContactPage.tsx`: Primary lead capture page.
- `apps/site/src/pages/Compliance.tsx`, `OperationalTrail.tsx`, `ServicesHub.tsx`, `Resources.tsx`: Secondary service and support content.
- `apps/site/src/components/CtaSection.tsx`: Global call-to-action component.
- `apps/site/src/styles.css`: Central styles for typography, layout, and components.

## Implementation Steps

### 1. Website P1 — Simplify Conversion & Reduce "Portal Gravity"
- **Demote Portal Visibility:**
  - Move the "Portal" link in `Layout.tsx` from the main header nav to the utility top-bar or footer only.
  - Ensure the primary navigation focuses purely on prospect-facing paths: Services / Industries / Case Studies / About / Contact.
- **Trim Homepage Quick Paths:**
  - In `Home.tsx`, remove or visually demote "Compliance" and "Resources" from the hero/quick-path section.
  - Refocus the homepage on service/contact-led conversion.
- **Two-Stage Contact Form:**
  - Redesign `ContactPage.tsx` into a multi-step experience:
    - **Step 1:** Capture Name, Work Email, Phone, Service Type, and Message.
    - **Step 2:** Show Company, Site Location, and extra details only after Step 1 is valid (or only for non-general intents).
  - Goal: Reduce initial cognitive load and friction for new inquiries.

### 2. Website P2 — Secondary Page Copy Cleanup
- **Support-Focused Compliance:**
  - Refine `Compliance.tsx` to ensure it reads as helpful support content rather than a primary acquisition tool.
- **Outcome-Led Case Studies:**
  - Update `OperationalTrail.tsx` (Case Studies) to ensure cards and headers are client-readable and result-first.
- **Plain-Language Preservation:**
  - Audit `ServicesHub.tsx` and `Resources.tsx` to remove any lingering technical jargon or internal "operational" language.

### 3. Visual QA & Polish (Ongoing)
- **Typography & Spacing:**
  - Refine `line-height` and `letter-spacing` in `styles.css`.
  - Standardize vertical rhythm and card spacing.
- **Interactive Elements:**
  - Premium button hover states and card elevation depth.
- **Responsive Integrity:**
  - Audit mobile (375px), tablet (768px), and desktop (1440px).
  - Ensure centered alignment for hero sections on mobile.

## Verification & Testing
- **Manual Verification:**
  - Test the two-stage form flow for logical progression and submission.
  - Verify that the Portal link no longer competes with primary CTA's.
  - Perform a visual review on mobile/tablet/desktop.
- **Automated Verification:**
  - Run `npm run build -w @kharon/site` to ensure no build regressions.
  - Run `npm run lint` to maintain code standards.
