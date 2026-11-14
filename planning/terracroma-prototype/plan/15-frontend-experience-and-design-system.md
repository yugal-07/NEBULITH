# Frontend experience and design system

**Purpose:** Define the navigation, visual language, map workspace and interaction patterns so the application feels like a research instrument rather than a generic AI dashboard.

## Scope
### In scope
- Task-centered workflow, map-first workspace, evidence drawer, comparison and responsive navigation
- Brand tokens, data-viz semantics, microinteractions and reduced motion

### Out of scope
- Generic sci-fi dashboard; NASA logo usage; gratuitous gradients/glow/glass; decorative bento cards

## Tasks
- [ ] [TASK:P15-001] Write the design read and dials in DESIGN.md.
- [ ] [TASK:P15-002] Design task-centered navigation around target selection, discovery, evidence, mission plan and reports.
- [ ] [TASK:P15-003] Create semantic color/type/spacing/radius/elevation tokens.
- [ ] [TASK:P15-004] Define map, layer, evidence, source, uncertainty and missing-data components.
- [ ] [TASK:P15-005] Review mobile, keyboard, contrast, reduced motion and map fallback.

## Dependencies
- `06-anti-slop-skills-mapping.md`
- `07-ui-ux-pro-max-skills-mapping.md`

## Acceptance criteria
- [ ] The UI has one dominant task focal point per screen.
- [ ] All data visualizations explain units, source, scale and missingness.
- [ ] All interactions work on keyboard and touch.
- [ ] Visual design avoids generic AI patterns while retaining a distinctive science identity.

## Anti-slop alignment
antislop-ui/human/layoutmobile/core Delivery Gate; UI UX Pro Max accessibility→touch→performance→style→responsive priority order.

## Estimated effort
L

## Status
**Status:** Not started

### Brand direction
Working name: Terracroma.ai. Voice: curious, precise, field-science literate. Visual identity: planetary cartography, geological strata, mission field notebooks and instrument readouts. Poster-inspired blue serves as the primary navigation/brand cue; dark navy is workspace ground; a restrained lime/yellow accent marks the single highest-priority action or selected target. Scientific raster colors must follow data meaning, not brand colors. No NASA marks or endorsement language.

### Layout contract
Desktop: primary map/planet canvas, mission/target controls in a left rail, contextual evidence in a right panel. Mobile: full-screen map with bottom-sheet controls and vertically stacked evidence; 3D interactions are optional, not required. A comparison view must expose both source and target metadata.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
