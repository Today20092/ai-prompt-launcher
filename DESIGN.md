---
name: Promptroom
description: The Quiet Workbench — calm, practical, focused.
colors:
  background: "#faf9f6"
  foreground: "#262522"
  primary: "#5144b8"
  primary-foreground: "#ffffff"
  secondary: "#eeebfb"
  secondary-foreground: "#403487"
  muted: "#f0efeb"
  muted-foreground: "#68655f"
  popover: "#ffffff"
  border: "#d7d4ce"
  input: "#858178"
  ring: "#6856d5"
  destructive: "#b32e2e"
  dark-background: "#1b1a20"
  dark-foreground: "#eeedf3"
  dark-primary: "#b4a8ff"
  dark-primary-foreground: "#21194c"
  dark-secondary: "#302b45"
  dark-secondary-foreground: "#d6ceff"
  dark-accent-foreground: "#e0d9ff"
  dark-muted: "#26242c"
  dark-muted-foreground: "#b1adb9"
  dark-border: "#48444f"
  dark-input: "#7f7a8a"
  dark-destructive: "#ffaaaa"
typography:
  title:
    fontFamily: "'Geist Variable', system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 2vw, 1.8rem)"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  body:
    fontFamily: "'Geist Variable', system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.5
  label:
    fontFamily: "'Geist Variable', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 11px"
  button-outline:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 11px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 11px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 11px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 11px"
  prompt-selected:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.85rem"
  preview:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
---

# Design System: Promptroom

## Overview

**Creative North Star: "The Quiet Workbench"**

Promptroom is calm, practical, and focused. Warm neutral surfaces and a limited violet accent frame the user's text. The interface gives saved prompts a stable place beside a spacious editing area; supporting controls stay compact.

The system is mostly flat, separated by borders and color. Subtle shadows give buttons and dialogs definition. Softly rounded, restrained controls make the workbench approachable without competing with its content. This records the existing `personal-ui/` system, not the original launcher at `/legacy/`.

**Key Characteristics:**

- Warm neutral canvas with violet actions and selection.
- One sans-serif family, with hierarchy carried by size and weight.
- Spacious workspace, compact supporting controls.
- Border-led grouping, gentle corners, and restrained depth.
- Equivalent light and dark themes with visible keyboard focus.

## Colors

The palette combines warm neutrals with violet; dark mode shifts to charcoal surfaces and lavender accents. Frontmatter records source values from `personal-ui/src/styles/global.css`; use the live semantic CSS variables when implementing components.

### Primary

- **Workbench Violet** (`primary`): primary actions and the selected prompt's border and inset marker. Its paired foreground supplies button text.
- **Lavender** (`dark-primary`): the corresponding dark-theme action and focus color, paired with deep violet text.
- **Focus Violet** (`ring`): the light-theme keyboard focus outline.

### Secondary

- **Pale Lavender** (`secondary`): selected prompt surfaces, secondary actions, and light-theme hover accents; use the paired dark-violet foreground for secondary controls.
- **Deep Lavender Charcoal** (`dark-secondary`): dark-theme selection and hover surfaces. Dark secondary and accent foregrounds are separate source tokens.

### Neutral

- **Warm Paper** (`background`): page and light-theme field background.
- **Ink** (`foreground`): primary text.
- **White Surface** (`popover`): light-theme preview panels, dialogs, and outlined buttons.
- **Soft Stone** (`muted`): subdued grouping and hover surfaces; muted foreground carries supporting text.
- **Stone Line** (`border`): structural separators. The stronger `input` token defines control boundaries.
- **Charcoal** (`dark-background`): dark page background; `dark-muted` also supplies dark popover surfaces.
- **Pale Ink** (`dark-foreground`): dark-theme primary text; `dark-muted-foreground` supports helper copy.

### Status

`destructive` and its dark counterpart communicate errors. The global stylesheet also maps info, success, and warning tokens to Tailwind's blue, emerald, and amber palettes; preserve those semantic mappings rather than treating them as brand accents.

**The Semantic Pair Rule.** Change background and foreground roles together when switching themes. In light mode, accent matches secondary; in dark mode, accent has its own foreground. Dark focus uses the primary color.

## Typography

**Display and Body Font:** Geist Variable, with system-ui and sans-serif fallbacks. There is no separate display or monospace family. Prompt previews inherit the interface font.

The type is compact and direct. Semibold headings establish structure while smaller muted copy explains fields and handoff behavior.

### Hierarchy

- **Title:** the fluid frontmatter title role names the active prompt. It is visually replaced by the prompt picker on phones for saved prompts.
- **Brand:** medium-sized wordmark (1.15rem, weight 650); narrows to 1rem at the smallest breakpoint.
- **Body:** the frontmatter body role supplies the base text. Prompt descriptions use a smaller size (0.9rem, line-height 1.5).
- **Label:** the frontmatter label role covers compact controls and disclosure headings. Prompt-list titles are slightly stronger (weight 600).
- **Supporting copy:** helper/status text uses 0.8rem with line-height 1.5–1.6; required labels, counts, and metadata use 0.75rem.
- **Preview:** readable interface text (0.875rem, line-height 1.75), preserving line breaks and wrapping long content.

Phone input and textarea text is explicitly 16px. Preserve that override when changing registry components.

## Layout

The header and workbench share a centered maximum width (1200px). Desktop uses a library column (260px) and a flexible workspace. A border separates the columns; the page itself is not enclosed in a raised card.

The workspace has generous top spacing (2rem), fluid horizontal padding (`clamp(1.5rem, 4vw, 3.5rem)`), and vertically stacked fields. The launch area is separated by a top border. Preview and advanced options are bordered disclosures in normal document flow. Primary actions remain in that flow rather than covering the input.

At widths up to 760px, the library becomes a prompt picker beside the compact Prompt actions popup trigger, the workspace stacks, and horizontal padding becomes 1rem. The compact header keeps New prompt reachable while Workspace groups Transfer and Preferences. New prompt and Prompt actions use named icon buttons on phones; Workspace also hides its visible label at widths up to 360px. Launch actions use two columns, then one at widths up to 360px. Phone interactive targets have a minimum height of 44px.

Template editing becomes full-screen below 640px. Desktop expanded editing uses a two-column form with the template body spanning both columns. At viewport heights up to 480px, the whole dialog scrolls so its content remains reachable.

## Elevation & Depth

Surfaces are mostly flat and use borders and tonal changes for separation. Buttons and fields have subtle edge highlights and small shadows from the registry; dialogs add a low-opacity shadow over a darkened, blurred backdrop. Selected prompts use an inset accent marker rather than a floating-card effect. Exact reusable depth and motion examples live in `.impeccable/design.json`.

**The Quiet Depth Rule.** Use the existing registry depth for controls and overlays; use borders and surface color for the main workspace.

## Shapes

The main page structure stays square and open. Controls, prompt entries, and disclosure panels share the large radius from frontmatter. Dialogs use softer corners on desktop and square full-width edges in their mobile sheet treatment; the template editor fills the phone viewport. Thin borders define controls and groups.

Icons are compact line drawings from Lucide. The brand combines a violet sparkle icon with the Promptroom name. Favorite stars fill when selected.

## Components

### Buttons

Softly rounded and restrained. Primary buttons pair primary fill and foreground; outlined buttons use a stronger input border, and ghost buttons gain an accent background on interaction. Secondary controls use paired secondary roles. Desktop default dimensions are in frontmatter; phone overrides enlarge targets and allow action text to wrap.

Primary hover and pressed states reduce fill opacity; pressed controls lose their outer shadow. Disabled controls reduce opacity and stop interaction. Preserve the global focus outline even when registry utilities remove outlines.

### Prompt Navigation

Left-aligned title and description in a vertical list. Selection combines secondary fill, primary border, and an inset marker (3px). Forced-colors mode adds a Highlight outline. Phone navigation uses the labeled select instead of the sidebar.

### Inputs and Fields

Rounded outlined wrappers with stronger boundaries than structural dividers. Multiline input grows within limits and scrolls internally; labels and required indicators sit above it. Focus changes border/ring and retains the global outline. Errors use descriptive text and semantic error color. Dark fields use the registry's translucent input fill.

Temporary-input guidance sits beside each input and is associated with the field. The destination helper explains the difference between following the preferred app and remembering a named app for this prompt.

### Preview and Options

Bordered, rounded surfaces with full-width disclosure triggers. Plus/minus indicators communicate closed/open state. The preview includes a character count; expanded text wraps, remains selectable, and uses the interface font. Dividers separate trigger and body.

The complete preview opens for each prompt's first use in the current session and after saving a template. Explicit open/closed choices are remembered per prompt until reload. Workspace and Prompt actions use cnippet Popover for labeled, anchored action groups. Opening a management popup must not move the header, prompt title, input, preview, or launch controls. Popup actions have visible labels, keyboard focus, Escape/outside-click dismissal, and viewport collision handling. Preview and T3 options retain their ordinary in-flow disclosure behavior.

### Dialogs

Popover surfaces with a clear title, explanatory copy, scrollable content, and grouped footer actions. Backdrop and popup transitions take 200ms; reduced-motion handling minimizes animation globally. Keep the existing mobile sheet/full-screen and short-viewport behavior.

### Focus and Feedback

Global keyboard focus is an unlayered outline (3px, offset 2px); scroll viewports, options, and preview text use an inward offset where needed. Keep status regions available for announcements even when empty. Error recovery stays visible beside the relevant workflow.

## Do's and Don'ts

### Do:

- **Do** use paired semantic colors and the existing light/dark theme mappings.
- **Do** keep prompt text readable, selectable, and fully wrapped in the preview.
- **Do** preserve visible focus, phone target sizing, and reduced-motion behavior.
- **Do** use the existing Base UI registry components with app-level accessibility overrides.

### Don't:

- **Don't** replace the selected prompt's border and marker with color alone.
- **Don't** let registry utilities remove the global focus outline.
- **Don't** obscure inputs with floating launch controls.
- **Don't** treat the legacy launcher's styling as the current workbench's design system.
