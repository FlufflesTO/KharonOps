# Implementation Plan: Site Polish & Conversion Simplification

## Objective
Refine the Kharon marketing site to align with the new commercial brand voice, simplify user conversion paths, and ensure high-quality visual standards across all devices.

## Key Files & Context
- `apps/site/src/pages/ContactPage.tsx`: Primary lead capture page.
- `apps/site/src/components/CtaSection.tsx`: Global call-to-action component.
- `apps/site/src/styles.css`: Central styles for typography, layout, and components.
- `apps/site/src/constants/siteData.ts`: Site-wide constants including contact paths.

## Implementation Steps

### 1. Conversion Simplification
- **Streamlined Contact Form:**
  - Redesign `ContactPage.tsx` to use a single, high-conversion form layout.
  - Simplify the "Contact Path" selection into a clear dropdown or a set of visually weighted cards.
  - Ensure the form defaults to "Request a Quote" as the primary intent.
- **CTA Refinement:**
  - Update `CtaSection.tsx` to emphasize "Request a Quote" as the primary button.
  - Move "Book Maintenance" and "Emergency Callout" to secondary button styles to reduce decision fatigue.

### 2. Visual Polish
- **Typography & Spacing:**
  - Refine `line-height` and `letter-spacing` in `styles.css` for optimal readability.
  - Standardize vertical rhythm and card spacing across all site sections.
- **Interactive Elements:**
  - Enhance button hover states with subtle transitions.
  - Improve card elevation and shadow depth to create a more premium feel.
- **Brand Consistency:**
  - Verify consistent use of the Kharon palette (blue, purple, black, gray).

### 3. Visual QA & Responsiveness
- **Responsive Pass:**
  - Audit all pages on mobile (375px), tablet (768px), and desktop (1440px) breakpoints.
  - Fix any layout "broken" states at intermediate viewport widths.
- **Alignment & Integrity:**
  - Ensure centered alignment for hero sections on mobile.
  - Verify that no horizontal scrolling occurs on mobile devices.

## Verification & Testing
- **Manual Verification:**
  - Submit the simplified contact form and verify the API payload.
  - Perform a visual review on at least three different screen sizes.
- **Automated Verification:**
  - Run `npm run build -w @kharon/site` to ensure no build regressions.
  - Run `npm run lint` to maintain code standards.
