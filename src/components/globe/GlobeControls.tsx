import { useState } from 'react'
import { Grid2X2, Layers3, Minus, Plus, RotateCcw, ScanLine } from 'lucide-react'
import type { Planet } from '../../types'

type Props = {
  planet: Planet
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onResetRotation: () => void
  grid: boolean
  onGridChange: (enabled: boolean) => void
  clouds: boolean
  onCloudsChange: (enabled: boolean) => void
}

export function GlobeControls({ planet, onZoomIn, onZoomOut, onReset, onResetRotation, grid, onGridChange, clouds, onCloudsChange }: Props) {
  const [layersOpen, setLayersOpen] = useState(false)
  return (
    <div className="globe-control-wrap">
      {layersOpen && (
        <div className="layer-popover" aria-label="Globe display layers">
          <p className="layer-heading">SURFACE LAYERS</p>
          {planet === 'Earth' && <label><input type="checkbox" checked={clouds} onChange={(event) => onCloudsChange(event.target.checked)} /> Cloud cover <span>EARTH</span></label>}
          <label><input type="checkbox" checked={grid} onChange={(event) => onGridChange(event.target.checked)} /> Coordinate grid <span>SPHERE</span></label>
          <p className="layer-note">Planet surface textures are for visual orientation and are not analysis products.</p>
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
