# Screen Routes and Interaction Checklist

| Route | Screen | Primary action | Data contract | Empty/error behavior |
|---|---|---|---|---|
| `/workspace` | Mission Workspace | Create/open study | `Study` | Show create/demo actions; no fake recent activity. |
| `/explorer` | Planetary Explorer | Select body, target and AOI | `TargetAOI`, `SourceLayer` | Mark unavailable layer and explain why. |
| `/discovery` | Analog Discovery | Run mission-specific matching | `Candidate`, `EvidenceValue` | Explain no coverage/no candidates. |
| `/comparison` | Comparison Studio | Compare target and candidates | `ComparisonModel` | Prevent incompatible differencing. |
| `/transferability` | Transferability | Inspect experiment gaps | `TransferabilityCondition` | Show unknown where evidence is absent. |
| `/rehearsal` | Mission Rehearsal | Place waypoints and calculate route | `RouteResult` | Explain unavailable terrain; never imply safe. |
| `/reports` | Reports | Generate/download study report | `StudySnapshot`, `Export` | Disable export until study has required evidence. |

All routes require a page title, one clear primary action, visible loading/error/empty state, keyboard access and responsive layout. Map interactions must have a text/list alternative.
