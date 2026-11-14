# UI UX Pro Max skills mapping

**Purpose:** Translate the UI UX Pro Max skill system into concrete design, accessibility, interaction, performance and implementation rules for Terracroma.ai.

## Scope
### In scope
- Main ui-ux-pro-max rule categories and searchable design data
- Design subskill taxonomy and routing
- Visual language, information hierarchy and data-viz quality gates

### Out of scope
- Running every logo/banner/social asset workflow as part of the application
- Using decorative output to stand in for working interface components

## Tasks
- [ ] [TASK:P07-001] Use the main skill priority order to review accessibility and interactions first.
- [ ] [TASK:P07-002] Create one reusable design system and page-specific variants only when justified.
- [ ] [TASK:P07-003] Map brand, token, implementation, icons and chart skills to concrete app screens.
- [ ] [TASK:P07-004] Record chosen framework and inspect matching stack guidance before coding UI.

## Dependencies
- `06-anti-slop-skills-mapping.md`

## Acceptance criteria
- [ ] The design-system document identifies semantic tokens, typography, chart semantics and interaction rules.
- [ ] The app uses accessible forms, correct loading/error states and responsive map tools.
- [ ] No charts display unlabelled axes, no data color is the sole carrier of meaning.

## Anti-slop alignment
Use ui-ux-pro-max priority categories: accessibility; touch/interaction; performance; style selection; layout/responsive; typography/color; animation; forms/feedback; navigation; charts/data. Combine with antislop's purpose test.

## Estimated effort
M

## Status
**Status:** Not started

### Verified taxonomy from the referenced repository (accessed 2026-11-14)
The `ui-ux-pro-max` main skill describes searchable local guidance: 79 searchable styles (50 active), 192 product palettes/reasoning profiles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types and 22 technology stacks. It prioritizes ten categories: (1) Accessibility, (2) Touch & Interaction, (3) Performance, (4) Style Selection, (5) Layout & Responsive, (6) Typography & Color, (7) Animation, (8) Forms & Feedback, (9) Navigation Patterns, (10) Charts & Data. Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md

The `design` skill routes work into `brand`, `design-system`, `ui-styling`, and built-in logo, corporate identity program (CIP), slides, banner and icon workflows. These are documented in `design/references/design-routing.md`. For the Terracroma app, prioritize brand, design-system, ui-styling, icon design and chart guidance. Slides are useful for the pitch; logo/CIP/banner/social assets are optional and out of MVP scope. Sources: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills ; https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/design/SKILL.md ; https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/design/references/design-routing.md .

### Concrete product direction
- Brand: planetary field science, analog expedition and evidence cartography. Use deep-space navy/ink as the map workspace base, clean white typography, blue as the agency-poster cue, and one restrained high-visibility lime/yellow action accent. Never use NASA insignia or imply NASA endorsement.
- Data visualization: sequential palettes for continuous elevation; diverging palettes for target-relative differences; categorical colors for geology classes; color plus label/pattern for confidence and missing data. Always include units, legends, source date and no-data state.
- UI structure: the map is the primary workspace. Left rail controls target/AOI/experiment; map is central; right evidence panel is contextual and collapsible; comparison views can expand horizontally on desktop and stack on mobile. Avoid stat cards detached from decisions.
- Interaction: keyboard-accessible search, visible focus, 44 px minimum touch targets, reduced-motion option, clear disabled/loading/error states, no hover-only controls.
- Performance: lazy-load non-critical imagery, reserve dimensions, use vector/raster tile pyramids, virtualize large candidate lists, move heavy raster analysis to server/workers.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
