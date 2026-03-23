import { useState } from 'react'
import { Palette, Sliders, Plus, Trash2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface StyleBlend {
  style: string
  weight: number
}

interface StyleFusionProps {
  onStyleFusionChange: (styles: StyleBlend[]) => void
  enabled?: boolean
}

const AVAILABLE_STYLES = [
  { value: 'modern', label: 'Modern', color: 'from-blue-500 to-cyan-500' },
  { value: 'traditional', label: 'Traditional', color: 'from-rose-500 to-pink-500' },
  { value: 'fusion', label: 'Fusion', color: 'from-purple-500 to-violet-500' },
  { value: 'minimalist', label: 'Minimalist', color: 'from-gray-500 to-slate-500' },
  { value: 'bohemian', label: 'Bohemian', color: 'from-green-500 to-emerald-500' },
  { value: 'cyberpunk', label: 'Cyberpunk', color: 'from-pink-500 to-rose-500' },
  { value: 'vintage', label: 'Vintage', color: 'from-amber-500 to-orange-500' },
]

export default function StyleFusion({ onStyleFusionChange, enabled = false }: StyleFusionProps) {
  const [styles, setStyles] = useState<StyleBlend[]>([
    { style: 'modern', weight: 70 },
    { style: 'traditional', weight: 30 }
  ])

  const addStyle = () => {
    if (styles.length >= 3) {
      toast.error('Maximum 3 styles allowed')
      return
    }
    
    const usedStyles = styles.map(s => s.style)
    const availableStyle = AVAILABLE_STYLES.find(s => !usedStyles.includes(s.value))
    
    if (availableStyle) {
      const newStyles = [...styles, { style: availableStyle.value, weight: 50 }]
      setStyles(newStyles)
      onStyleFusionChange(newStyles)
    } else {
      toast.error('All styles already selected')
    }
  }

  const removeStyle = (index: number) => {
    if (styles.length <= 1) {
      toast.error('Minimum 1 style required')
      return
    }
    
    const newStyles = styles.filter((_, i) => i !== index)
    setStyles(newStyles)
    onStyleFusionChange(newStyles)
  }

  const updateWeight = (index: number, weight: number) => {
    const newStyles = styles.map((style, i) => 
      i === index ? { ...style, weight } : style
    )
    setStyles(newStyles)
    onStyleFusionChange(newStyles)
  }

  const getStyleInfo = (styleValue: string) => {
    return AVAILABLE_STYLES.find(s => s.value === styleValue) || AVAILABLE_STYLES[0]
  }

  if (!enabled) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Palette className="text-white" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Style Fusion</h3>
          <p className="text-sm text-gray-600">Blend multiple styles for unique designs</p>
        </div>
      </div>

      <div className="space-y-4">
        {styles.map((styleBlend, index) => {
          const styleInfo = getStyleInfo(styleBlend.style)
          return (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${styleInfo.color} rounded-lg flex items-center justify-center`}>
                    <Sparkles className="text-white" size={16} />
                  </div>
                  <select
                    value={styleBlend.style}
                    onChange={(e) => {
                      const newStyles = styles.map((s, i) => 
                        i === index ? { ...s, style: e.target.value } : s
                      )
                      setStyles(newStyles)
                      onStyleFusionChange(newStyles)
                    }}
                    className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    {AVAILABLE_STYLES.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {styles.length > 1 && (
                  <button
                    onClick={() => removeStyle(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Sliders size={16} className="text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={styleBlend.weight}
                  onChange={(e) => updateWeight(index, parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${styleBlend.weight}%, #e5e7eb ${styleBlend.weight}%, #e5e7eb 100%)`
                  }}
                />
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                  {styleBlend.weight}%
                </span>
              </div>
            </div>
          )
        })}

        {styles.length < 3 && (
          <button
            onClick={addStyle}
            className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Plus size={16} />
            Add Style
          </button>
        )}

        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-xs text-purple-700 text-center">
            <strong>Style Fusion:</strong> {styles.map(s => `${getStyleInfo(s.style).label} (${s.weight}%)`).join(' + ')}
          </p>
        </div>
      </div>
    </div>
  )
}
