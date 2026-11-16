---
name: Ledgerly Review Desk
description: An accountant's working desk for evidence-led AI bookkeeping review.
colors:
  docket-navy: "#152825"
  approval-teal: "#17735f"
  exception-vermilion: "#b54e35"
  ledger-paper: "#f4f0e7"
  working-sheet: "#fffdf8"
  rule-line: "#d8d1c3"
  ink: "#172722"
  muted-ink: "#5e6964"
  audit-gold: "#e9c36f"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2rem, 4vw, 3.125rem)"
    fontWeight: 570
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  control: "11px"
  surface: "15px"
  compact: "9px"
spacing:
  compact: "9px"
  standard: "18px"
  spacious: "28px"
components:
  button-primary:
    backgroundColor: "{colors.approval-teal}"
    textColor: "{colors.working-sheet}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "40px"
  working-surface:
    backgroundColor: "{colors.working-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
---

# Design System: Ledgerly Review Desk

## Overview

**Creative North Star: "The Accountant's Working Desk"**

Ledgerly feels like a composed set of working papers rather than a generic software dashboard. Warm paper, an ink-dark docket rail, audit-gold details, and precise approval and exception colors make every screen feel accountable, calm, and ready for scrutiny.

The system is dense enough for professional review but gives important decisions generous separation. Decorative effects never obscure provenance, balance, warnings, or client scope.

**Key Characteristics:**
- Evidence and status stay visually adjacent.
- Registers and ruled lists carry operational information.
- Teal means approved or safe to proceed; vermilion means stop and investigate.
- Every simulated action is visibly labeled.

## Colors

The palette combines warm accounting paper with dark mineral ink and sparingly used control colors.

**The Control Color Rule.** Approval teal and exception vermilion communicate state; they are never ambient decoration.

## Typography

**Display Font:** Newsreader with Georgia fallback  
**Body Font:** Manrope with Arial fallback

Newsreader gives headings the authority of a formal working paper. Manrope keeps forms, registers, and amounts compact and unambiguous. Operational text must remain at least 10px in the current dense prototype and should increase when space permits.

**The Two-Voice Rule.** Newsreader names the work; Manrope performs it.

## Layout

Desktop uses a fixed 245px docket rail with a fluid working canvas capped at 1420px. Primary surfaces use 15px corners and 18–28px internal rhythm. At 1050px two-column work areas stack; below 760px the rail becomes a drawer, registers become accountable stacked rows, and critical client, exception, value, and evidence context remains visible. Review actions stay reachable in a compact sticky dock.

## Elevation & Depth

Depth is structural: wide, softly offset shadows lift active working sheets from the ledger-paper ground. Navigation selection and the sticky approval dock receive stronger elevation. Status chips and table rows remain flat.

**The Working-Paper Rule.** Elevation marks a movable or decision-bearing sheet, never a decorative tile.

## Shapes

Surfaces use gently curved 15px corners; controls use 9–11px corners. Pills are reserved for compact status and demo labels. The yellow desk note may use a near-square edge to feel physically distinct from application chrome.

## Components

### Buttons
- Primary actions use approval teal, white text, a soft downward shadow, and an 11px radius.
- Secondary actions use working-sheet white with a single inset rule-line stroke.
- Destructive actions use a pale vermilion field with dark vermilion text.
- Focus uses a high-contrast teal outline; mobile targets are at least 44px.

### Cards / Containers
- Working surfaces use sheet white, 15px corners, and ambient offset shadow.
- Registers separate rows with one rule line rather than nested cards.

### Inputs / Fields
- Inputs use an off-white ground, 9px corners, a single rule-line border, and a stronger teal border plus focus ring when active.

### Navigation
- The docket rail is ink navy. Default items use desaturated light text; the active item reverses to warm paper with dark ink and exposes `aria-current`.
- Mobile navigation becomes a dismissible drawer.

### Status and Demo Labels
- Status chips combine icon, label, and semantic color.
- Demo labels are audit gold and always include explicit “Demo / Simulated” language.

## Do's and Don'ts

### Do:
- **Do** keep source evidence, proposed accounting treatment, and review action in one visible workflow.
- **Do** use ruled registers for repeated operational records.
- **Do** preserve client scope and exception context at every breakpoint.

### Don't:
- **Don't** use approval or exception colors for decoration.
- **Don't** hide accountability context to simplify mobile layouts.
- **Don't** introduce generic equal-card metric grids or unlabeled mock operations.
