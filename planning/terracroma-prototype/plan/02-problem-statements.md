# Challenge and problem statements

**Purpose:** Translate the official NASA Space Apps challenge brief and the user-provided project statement into traceable product requirements.

## Scope
### In scope
- Official challenge description and its requested use of open Earth, Moon and Mars data
- Need to identify and characterize new terrestrial analogs beyond famous sites
- Outputs as map, visualization or another usable tool
- User feature brief as product baseline

### Out of scope
- Interpreting the challenge as a demand for a full commercial platform
- Treating secondary compilations as official challenge resource lists

## Tasks
- [ ] [TASK:P02-001] Capture official page wording, difficulty/subject labels and source URL.
- [ ] [TASK:P02-002] Create requirement IDs for discovery, characterization, open data and presentation.
- [ ] [TASK:P02-003] Map every baseline feature and novel feature to measurable challenge needs.
- [ ] [TASK:P02-004] Record what is not visible or accessible in the official Resources tab and video.

## Dependencies
- `01-project-overview.md`

## Acceptance criteria
- [ ] Every official challenge requirement has a traceability row with a plan file and acceptance test.
- [ ] Facts from the poster, challenge page, uploaded Terracroma feature document and external research are labelled separately.
- [ ] No missing resource is described as verified.

## Anti-slop alignment
antislop-copywriting: avoid inflated claims; human: expose uncertainty; core R-17: sourced facts only.

## Estimated effort
S

## Status
**Status:** Not started

### Official challenge brief (verified page search result, accessed 2026-11-14)
Title: “Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars.” Subjects: Earth Science, Planets & Moons, Software, Space Exploration. The page describes the need to consider topography, geology, environment and available resources; it names Atacama Desert, Haughton Crater and Death Valley as existing analog examples and states they are not entirely well characterized. The challenge asks teams to use open Earth, Moon and Mars data from NASA and other space agencies to identify and characterize new terrestrial analogs for future bases or landing sites, drawing on deserts, polar regions, volcanic and arid terrains, caves and other environments, then present findings as a map, visualization or other tool.
Official URL: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/

### Source distinction
The uploaded poster repeats the core challenge intent and gives the hackathon date/location context. The uploaded Terracroma feature brief is the team's proposed scope, not official challenge criteria. A third-party Space Data Atlas summary surfaced a practical six-dataset starter set; it is explicitly independent and must not be represented as the official resource tab.

### Access limitation
The official page's `?tab=resources` route could not be opened in the available page fetcher (cache miss), so the embedded video/YouTube URL and the complete official resources-tab contents have not been verified. Do not invent a YouTube video ID or claim it was watched. Keep a task open to manually inspect the official tab from a browser and add the exact links/transcript notes before a final public submission.

## Change notes
- 2026-11-14: Initial plan created. Update this section when scope or acceptance criteria materially change.
