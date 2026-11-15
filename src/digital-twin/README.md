# NEBULITH digital twin

This folder owns the rover digital-twin experience at `/digital-twin`.

- `DigitalTwinPage.tsx` — simulation UI, controls, telemetry and event history.
- `RoverSimulation.tsx` — Three.js scene, procedural terrain and rover motion.
- `simulationModel.ts` — deterministic terrain and rover response model.
- `terrainProfiles.ts` — terrain presets and engineering assumptions.
- `types.ts` — feature-local types.
- `digital-twin.css` — responsive visual system for this section.

The current scene is an interactive engineering demonstrator. Terrain and telemetry are procedural model outputs, not measured mission data or a safety certification.
