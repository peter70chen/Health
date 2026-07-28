---
name: Health Plan
description: A calm, precise mobile health logging instrument.
colors:
  canvas: "#000000"
  surface: "#171717"
  surface-raised: "#262626"
  border: "#404040"
  text: "#f5f5f5"
  text-muted: "#a3a3a3"
  accent: "#2dd4bf"
  intake: "#fb923c"
  water: "#60a5fa"
  warning: "#fbbf24"
  danger: "#f87171"
typography:
  title:
    fontFamily: "Noto Sans TC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "Noto Sans TC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Noto Sans TC, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  sm: "6px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  field:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
    height: "48px"
---

# Design System: Health Plan

## Overview

**Creative North Star: "The Daily Health Instrument"**

Health Plan is a compact mobile tool used repeatedly throughout the day. The interface is dark to remain comfortable in mixed indoor lighting, with restrained teal reserved for current state and primary actions. Information is ordered by frequency: today's status, logging actions, today's records, then trends and history.

The system rejects decorative wellness styling and generic dashboard card walls. Density is welcome when it makes comparison faster, but every group must have a clear purpose and one dominant action.

**Key Characteristics:**
- Mobile-first and comfortable for one-handed use.
- Quiet neutral surfaces with a limited semantic palette.
- Stable tabular numbers and explicit units.
- Familiar controls, short transitions, and progressive disclosure.

## Colors

Near-black neutral layers create structure; teal is the interaction accent, while intake, water, warning, and danger colors retain narrow semantic roles.

### Primary
- **Action Teal** (`#2dd4bf`): current navigation, focus, primary buttons, and positive progress.

### Secondary
- **Intake Orange** (`#fb923c`): calorie and food intake values only.
- **Water Blue** (`#60a5fa`): hydration values and actions only.

### Neutral
- **Canvas Black** (`#000000`): page background.
- **Quiet Surface** (`#171717`): primary content groups.
- **Raised Surface** (`#262626`): controls and elevated rows.
- **Readable Muted Text** (`#a3a3a3`): secondary copy that still meets contrast requirements.

**The Semantic Color Rule.** A color may identify one data meaning or one interaction state. It is not decoration.

## Typography

**Display Font:** Noto Sans TC with the system sans-serif stack
**Body Font:** Noto Sans TC with the system sans-serif stack

**Character:** Clear and familiar. Weight and spacing establish hierarchy without introducing display typography.

### Hierarchy
- **Headline** (700, 24px, 1.35): screen and modal titles.
- **Title** (700, 20px, 1.4): section titles and important values.
- **Body** (400, 18px, 1.5): explanations and editable content.
- **Label** (500, 16px, 1.5): field labels, metadata, and compact controls.
- **Caption** (500, 14px, 1.4): supporting data only; never essential instructions.

**The Stable Data Rule.** Numbers use tabular figures, keep units visible, and never resize their container when values change.

## Elevation

The app is flat by default. Depth comes from neutral surface changes and one-pixel borders. Shadows are reserved for sticky navigation, dialogs, and transient status messages.

**The Flat-by-Default Rule.** Static content groups do not receive decorative shadows.

## Components

### Buttons
- **Shape:** compact rounded rectangle (`8px`), with a minimum height of `44px`.
- **Primary:** solid teal with high-contrast text and an explicit verb-object label.
- **Hover / Focus:** restrained color shift and visible focus ring; active feedback may scale slightly.
- **Icon buttons:** familiar symbol, accessible name, and a square touch target.

### Cards / Containers
- **Corner Style:** `8px` for repeated items and framed tools.
- **Background:** quiet surface or unframed page bands.
- **Shadow Strategy:** none at rest.
- **Border:** one-pixel neutral border when separation is needed.
- **Internal Padding:** `16px`, with `24px` only for a primary summary group.

### Inputs / Fields
- **Style:** raised neutral background, one-pixel border, permanent label, `8px` radius.
- **Focus:** teal border or ring with sufficient contrast.
- **Error / Disabled:** text explanation plus semantic color; color is not the only cue.

### Navigation
- Use two labeled top-level destinations: today and body trends.
- On phones, navigation remains reachable and does not cover content or safe areas.
- Active state combines text color and a shape or line indicator.

### Daily Summary
- Remaining calories are the dominant number.
- Intake and expenditure remain comparable but secondary.
- Food, water, and exercise logging are always directly reachable.

## Do's and Don'ts

### Do:
- **Do** preserve every existing logging, editing, calculation, backup, and export workflow during visual changes.
- **Do** order mobile content by daily frequency and keep important controls at least `44px` high.
- **Do** use `#2dd4bf` selectively for primary action and current state.
- **Do** verify the UI at 320px, 390px, 412px, mobile landscape, 200% zoom, and reduced motion.
- **Do** keep historical data labels, dates, values, and units explicit.

### Don't:
- **Don't** make a marketing landing page or generic SaaS dashboard.
- **Don't** use wellness-pastel decoration, glassmorphism, gradients, oversized headings, or ornamental animation.
- **Don't** create a wall of equally prominent cards or put cards inside cards.
- **Don't** hide food, water, or exercise logging behind a menu.
- **Don't** let color variety compete with data meaning.
- **Don't** change storage keys, calculation rules, AI request behavior, or existing logging workflows during visual work.
