# Anti-slop skills mapping

**Purpose:** Map all six uploaded Anti-Slop skill files to exact Terracroma development workflows and preserve the repository's purpose-driven design filter.

## Scope
### In scope
- Core antislop plus five focused skills
- Skill purpose, load condition, important rules/checklists and product application
- Repository-vs-upload coverage verification

### Out of scope
- Copying all repository files into the application
- Treating Anti-Slop as a prescribed visual theme

## Tasks
- [ ] [TASK:P06-001] Confirm six uploads map to antislop core, UI, copywriting, human, layoutmobile and code.
- [ ] [TASK:P06-002] Build a component-to-skill routing matrix.
- [ ] [TASK:P06-003] Require core Delivery Gate for shipped interface changes.
- [ ] [TASK:P06-004] Record the six skill filenames and their mapping in the audit.

## Dependencies
- `00-MASTER-EXECUTION-GUIDE.md`

## Acceptance criteria
- [ ] All six uploaded skill documents have correct names and purpose.
- [ ] Every UI, copy, accessibility, responsive and code-comment task maps to an appropriate skill.
- [ ] No aesthetic rule is copied without a written purpose.

## Anti-slop alignment
Use antislop core R-01 through R-40 and C-1 through C-5 as the governing filter; each child skill supplements rather than replaces the core Delivery Gate.

## Estimated effort
M

## Status
**Status:** Not started

### Uploaded skill inventory (all six uploaded documents mapped)
| Uploaded file | Skill | Purpose / load condition | Terracroma application |
|---|---|---|---|
| `SKILL6.md` | `antislop` | Core filter. Load always for UI; resolve During/After mode, require design direction, purpose test, liveliness and Delivery Gate. | This project is new UI work, so the coding agent should choose/apply During mode for implementation only after explicit user mode is set in its environment; do not infer a saved preference from these files. Define DESIGN.md, then review hard gates, claims and functional interactions. |
| `SKILL5(1).md` | `antislop-ui` | UI/visual work: purpose-driven palette, layout, hierarchy, components, motion and performance. | Field-science cartography identity; no generic blue-purple gradient, full-page glow, glass everywhere, monotonous cards or fake demo states. Use the poster's blue/lime only with a clear brand rationale. |
| `SKILL2.md` | `antislop-copywriting` | Human-facing copy, claims, headlines, CTA and anti-AI text patterns. | No invented scientific claims, social proof or numeric metrics. Replace “AI predicts” with concrete “compares measured terrain indicators.” Keep caveats plain and visible. |
| `SKILL3.md` | `antislop-human` | Contrast, keyboard, focus, states, accessible controls and contrast checker. | Keyboard-operable maps where possible, textual alternatives to color-coded layers, visible focus, WCAG contrast, empty/loading/error states and reduced-motion behavior. |
| `SKILL4.md` | `antislop-layoutmobile` | Responsive layouts, reflow, overflow, tap targets and navigation. | Treat mobile as a separate map/research layout; layer drawer, stacked evidence, responsive comparison and zero horizontal overflow. |
| `SKILL1.md` | `antislop-code` | Code comment hygiene; only comments may be changed during comment cleanup. | Preserve scientific assumptions, units, transformations and algorithm rationale; remove decorative, redundant or vague TODO comments without touching executable logic. |

Repository overview currently lists the same core + five focused skills. Its public README presents the skills as one concern per folder, with child skills referencing core rules instead of renumbering them. Links: https://github.com/miqdadbadjuber/anti-slop ; https://github.com/miqdadbadjuber/anti-slop/tree/main/skills .

### Operating nuance
The core documentation says antislop is a filter, not a style guide. It expects design direction (DESIGN.md), a routing file (AGENTS.md or equivalent), and mode resolution. A read-only review does not itself select After mode. A coding agent using this repository should consult the uploaded core instructions for current-session mode handling before any visual implementation.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
