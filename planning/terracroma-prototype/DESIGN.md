# DESIGN.md — Terracroma.ai

**Reading this as:** an evidence-first planetary field-science and mission-planning application for planetary geologists, analog-site researchers and robotics/mission teams.

**Visual language:** planetary cartography, geological field notebooks, layered terrain interpretation and mission operations. Not generic “sci-fi AI dashboard.”

**Dials:** ENERGY 2 / RHYTHM 3 / MOTION 1. Energy comes from real terrain imagery and purposeful map focus; rhythm varies between map, comparison, evidence and experiment views; motion is restrained and communicates spatial transitions.

## Identity
- Primary cue: deep scientific blue inspired by the uploaded event poster, combined with dark navy/ink as the research workspace ground. This is a Terracroma direction, not NASA branding.
- Accent: restrained high-visibility lime/yellow for a selected target, important action or critical marker only.
- Neutral: warm white and slate for text, paper-like evidence panels and metadata.
- Scientific layers own their own semantic palettes; never force brand accent colors onto scientific values.
- Never use NASA logos, insignia or language implying NASA endorsement.

## Information architecture
Map/planetary canvas is the main instrument. Target and mission criteria are placed next to it; evidence and provenance appear in context. The primary sequence is Discover → Explain → Assemble → Simulate → Optimize. Reports and workspace are secondary.

## Visual rules
- Every color, grid, glow, shadow, glass surface and animation must have a documented purpose. Default to solid surfaces and precise borders.
- Use imagery from actual sourced data or label an illustrative visual as such. Never use fake telemetry or invented numeric metrics.
- Use visual hierarchy to distinguish observation, derived metric, model output and qualitative interpretation.
- Charts need units, legend, source/time context, confidence or uncertainty, and a visible no-data state.
- Do not use red/green alone to express status; pair hue with text and icon/shape.
- No perpetually pulsing markers, autoplay carousels or animated background orbs.

## Typography and layout
Use a readable UI sans for controls and a tabular/monospaced face only for coordinates, units and IDs. Keep body text comfortably readable. Desktop map workspace can use three zones; mobile uses a full map plus bottom sheets and vertically stacked evidence. Breakpoints follow content constraints, not named devices.

## Accessibility
WCAG AA text contrast; visible focus; keyboard operation; labels for icon controls; 44 px touch targets; reduced-motion support; text alternatives for map colors and gestures; 200% zoom without clipping.
