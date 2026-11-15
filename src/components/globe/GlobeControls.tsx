import { useState } from 'react'
import { Grid2X2, Layers3, Minus, Plus, RotateCcw, ScanLine } from 'lucide-react'
import type { Planet } from '../../types'
import type { Basemap } from './PlanetaryGlobe'

type Props = {
  planet: Planet
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onResetRotation: () => void
  grid: boolean
  onGridChange: (enabled: boolean) => void
  basemap: Basemap
  onBasemapChange: (basemap: Basemap) => void
}

export function GlobeControls({ planet, onZoomIn, onZoomOut, onReset, onResetRotation, grid, onGridChange, basemap, onBasemapChange }: Props) {
  const [layersOpen, setLayersOpen] = useState(false)
  return (
    <div className="globe-control-wrap">
      {layersOpen && (
        <div className="layer-popover" aria-label="Globe display layers">
          <p className="layer-heading">BASE MAP</p>
          {(planet === 'Earth'
            ? ([
                ['satellite', 'Satellite', 'ESRI'],
                ['street', 'Street map', 'OSM'],
                ['terrain', 'Terrain', 'DEM'],
              ] as const)
            : ([['satellite', `${planet} surface`, 'LOCAL XYZ']] as const)).map(([value, label, provider]) => (
              <button key={value} type="button" className="layer-choice" aria-pressed={planet !== 'Earth' || basemap === value} onClick={() => { if (planet === 'Earth') onBasemapChange(value) }}>
                <span className={`layer-radio${planet !== 'Earth' || basemap === value ? ' selected' : ''}`} />{label}<span>{provider}</span>
            </button>
          ))}
          <label className="layer-grid-toggle"><input type="checkbox" checked={grid} onChange={(event) => onGridChange(event.target.checked)} /> Coordinate grid <span>GLOBE</span></label>
          <p className="layer-note">{planet === 'Earth' ? 'Planetary maps use NASA Trek WMTS imagery. Earth terrain uses Terrarium elevation tiles.' : `${planet} surface tiles are stored locally.`}</p>
        </div>
      )}
      <div className="globe-controls" role="toolbar" aria-label="Planetary globe controls">
        <button type="button" title="Reset camera" aria-label="Reset camera view" onClick={onReset}><ScanLine /></button>
        <span className="control-divider" />
        <button type="button" title="Zoom in" aria-label="Zoom in" onClick={onZoomIn}><Plus /></button>
        <button type="button" title="Zoom out" aria-label="Zoom out" onClick={onZoomOut}><Minus /></button>
        <span className="control-divider" />
        <button type="button" title="Toggle surface layers" aria-label="Toggle surface layers" aria-expanded={layersOpen} className={layersOpen ? 'control-active' : ''} onClick={() => setLayersOpen((value) => !value)}><Layers3 /></button>
        <button type="button" title="Reset rotation" aria-label="Reset globe rotation" onClick={onResetRotation}><RotateCcw /></button>
        <button type="button" title="Toggle coordinate grid" aria-label="Toggle coordinate grid" aria-pressed={grid} className={grid ? 'control-active' : ''} onClick={() => onGridChange(!grid)}><Grid2X2 /></button>
      </div>
    </div>
  )
}
