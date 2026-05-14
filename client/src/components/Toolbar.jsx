import { useState } from 'react'
import { useWhiteboard } from '@/context/WhiteboardContext'
import {
  Pencil,
  Eraser,
  Trash2,
  RotateCcw,
  Download,
  Type,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Highlighter,
  Palette,
  ZoomIn,
  ZoomOut,
  Hand,
  Copy,
  Check,
  Menu,
  X,
} from 'lucide-react'

export function Toolbar({ onExport }) {
  const {
    selectedTool,
    setSelectedTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    zoom,
    setZoom,
    clearCanvas,
  } = useWhiteboard()

  const [showMenu, setShowMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const tools = [
    { id: 'select', label: 'Select', icon: Hand },
    { id: 'draw', label: 'Pencil', icon: Pencil },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'line', label: 'Line', icon: Minus },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'highlight', label: 'Highlighter', icon: Highlighter },
  ]

  const handleClearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      clearCanvas()
    }
  }

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
      {/* Main Toolbar */}
      <div className="glass rounded-2xl p-3 flex flex-col gap-2">
        {/* Tool Buttons */}
        <div className="flex flex-col gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  selectedTool === tool.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={tool.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </div>

        <div className="w-8 h-px bg-gray-600" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Color"
          >
            <Palette className="w-5 h-5" />
          </button>

          {showColorPicker && (
            <div className="absolute left-full ml-2 top-0 glass rounded-lg p-3 flex flex-col gap-2">
              <div>
                <label className="text-xs text-gray-300 mb-2 block">
                  Stroke
                </label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300 mb-2 block">Fill</label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stroke Width */}
        <div className="p-2.5 text-gray-400 text-xs">
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-8 cursor-pointer"
            title="Stroke width"
          />
        </div>

        <div className="w-8 h-px bg-gray-600" />

        {/* Canvas Controls */}
        <button
          onClick={() => setZoom(Math.min(zoom * 1.2, 5))}
          className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          onClick={() => setZoom(Math.max(zoom / 1.2, 0.2))}
          className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <button
          onClick={handleClearCanvas}
          className="p-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Clear canvas"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="w-8 h-px bg-gray-600" />

        {/* Export */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Menu"
        >
          {showMenu ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {showMenu && (
          <div className="absolute left-full ml-2 bottom-0 glass rounded-lg p-2 flex flex-col gap-1 whitespace-nowrap">
            <button
              onClick={() => {
                onExport('png')
                setShowMenu(false)
              }}
              className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
            >
              Export PNG
            </button>
            <button
              onClick={() => {
                onExport('json')
                setShowMenu(false)
              }}
              className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
            >
              Export JSON
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
