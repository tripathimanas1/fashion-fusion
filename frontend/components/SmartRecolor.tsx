import { useState } from 'react'
import { Palette, Droplets, RefreshCw, Sparkles, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { designsApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface SmartRecolorProps {
  designId: number
  designImage: string
  onRecolorComplete: (newImages: string[], totalImages: number) => void
}

const FABRIC_TYPES = [
  { value: 'cotton', label: 'Cotton', description: 'Soft, breathable fabric' },
  { value: 'silk', label: 'Silk', description: 'Luxurious, smooth fabric' },
  { value: 'denim', label: 'Denim', description: 'Durable, casual fabric' },
  { value: 'linen', label: 'Linen', description: 'Light, natural fabric' },
  { value: 'wool', label: 'Wool', description: 'Warm, cozy fabric' },
  { value: 'leather', label: 'Leather', description: 'Premium, durable fabric' },
  { value: 'velvet', label: 'Velvet', description: 'Luxurious, soft fabric' },
]

const QUICK_COLORS = [
  '#FF6B35', '#0077BE', '#10B981', '#8B5CF6', '#F43F5E', '#F59E0B', '#F97316', '#EC4899',
  '#6366F1', '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7', '#EF4444', '#22C55E'
]

export default function SmartRecolor({ designId, designImage, onRecolorComplete }: SmartRecolorProps) {
  const [activeTab, setActiveTab] = useState<'recolor' | 'fabric-swap'>('recolor')
  const [selectedColors, setSelectedColors] = useState<string[]>(['#FF6B35', '#0077BE'])
  const [selectedFabric, setSelectedFabric] = useState<string>('silk')
  const [preserveHighlights, setPreserveHighlights] = useState(true)
  const [preservePattern, setPreservePattern] = useState(true)
  const [adjustTexture, setAdjustTexture] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customColor, setCustomColor] = useState<string>('#FF6B35')

  const handleAddColor = (color: string) => {
    if (selectedColors.length < 5) {
      if (!selectedColors.includes(color)) {
        setSelectedColors([...selectedColors, color])
      } else {
        toast.error('This color is already selected')
      }
    } else {
      toast.error('Maximum 5 colors allowed')
    }
  }

  const handleRemoveColor = (index: number) => {
    setSelectedColors(selectedColors.filter((_, i) => i !== index))
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
  }

  const handleAddCustomColor = () => {
    if (customColor.match(/^#[0-9A-F]{6}$/i)) {
      handleAddColor(customColor)
    } else {
      toast.error('Please enter a valid hex color (e.g., #FF6B35)')
    }
  }

  const handleRecolor = async () => {
    if (!user) {
      toast.error('Please sign in to recolor designs')
      return
    }

    if (selectedColors.length === 0) {
      toast.error('Please select at least one color')
      return
    }

    setIsProcessing(true)
    try {
      const result = await designsApi.recolorDesign({
        design_id: designId,
        target_colors: selectedColors,
        fabric_type: selectedFabric,
        preserve_highlights: preserveHighlights,
        add_as_variation: true // Add to existing design
      })

      onRecolorComplete(result.image_urls, result.total_images)
      toast.success(result.message || 'Design recolored successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to recolor design')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFabricSwap = async () => {
    if (!user) {
      toast.error('Please sign in to swap fabric')
      return
    }

    setIsProcessing(true)
    try {
      const result = await designsApi.swapFabric({
        design_id: designId,
        target_fabric: selectedFabric,
        preserve_pattern: preservePattern,
        adjust_texture: adjustTexture,
        add_as_variation: true // Add to existing design
      })

      onRecolorComplete(result.image_urls, result.total_images)
      toast.success(result.message || 'Fabric swapped successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to swap fabric')
    } finally {
      setIsProcessing(false)
    }
  }

  const { user } = useAuth()

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Palette className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Smart Recolor & Fabric Swap</h3>
          <p className="text-sm text-gray-600">Transform your designs with AI-powered color and fabric changes</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('recolor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'recolor'
              ? 'bg-gradient-sunset text-white shadow-fashion'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Palette size={16} />
          Color Recolor
        </button>
        <button
          onClick={() => setActiveTab('fabric-swap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'fabric-swap'
              ? 'bg-gradient-ocean text-white shadow-ocean'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Droplets size={16} />
          Fabric Swap
        </button>
      </div>

      {/* Original Design Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Original Design</h4>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <img src={designImage} alt="Original design" className="w-full h-48 object-cover rounded-lg" />
        </div>
      </div>

      {/* Color Recolor Tab */}
      {activeTab === 'recolor' && (
        <div className="space-y-6">
          {/* Color Selection */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Select Colors</h4>
            
            {/* Selected Colors */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Selected Colors ({selectedColors.length}/5)</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedColors.map((color, index) => (
                  <div key={index} className="relative group">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <button
                      onClick={() => handleRemoveColor(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {selectedColors.length === 0 && (
                  <p className="text-gray-400 text-sm italic">No colors selected yet</p>
                )}
              </div>
            </div>

            {/* Quick Color Palette */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Quick Color Palette</p>
              <div className="grid grid-cols-8 gap-2">
                {QUICK_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleAddColor(color)}
                    className={`h-8 rounded-md border-2 transition-all ${
                      selectedColors.includes(color)
                        ? 'border-purple-500 shadow-purple-200 shadow-sm scale-110'
                        : 'border-gray-200 hover:border-purple-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {selectedColors.includes(color) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-0.5">
                          <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Custom Color</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    placeholder="#FF6B35"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={7}
                  />
                </div>
                <button
                  onClick={handleAddCustomColor}
                  disabled={selectedColors.length >= 5}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>

            {/* Fabric Type */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-2">Fabric Type (Optional)</label>
              <select
                value={selectedFabric}
                onChange={(e) => setSelectedFabric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {FABRIC_TYPES.map((fabric) => (
                  <option key={fabric.value} value={fabric.value}>
                    {fabric.label} - {fabric.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preserveHighlights}
                  onChange={(e) => setPreserveHighlights(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Preserve lighting and shadows</span>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRecolor}
            disabled={isProcessing || selectedColors.length === 0}
            className="w-full bg-gradient-sunset text-white py-3 rounded-xl font-semibold shadow-fashion hover:shadow-fashion-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing recolor...
              </>
            ) : (
              <>
                <Palette size={18} />
                Apply Color Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Fabric Swap Tab */}
      {activeTab === 'fabric-swap' && (
        <div className="space-y-6">
          {/* Fabric Selection */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Select Target Fabric</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {FABRIC_TYPES.map((fabric) => (
                <button
                  key={fabric.value}
                  onClick={() => setSelectedFabric(fabric.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedFabric === fabric.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{fabric.label}</div>
                    <div className="text-xs text-gray-500">{fabric.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preservePattern}
                  onChange={(e) => setPreservePattern(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Preserve original pattern</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={adjustTexture}
                  onChange={(e) => setAdjustTexture(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Apply realistic texture</span>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleFabricSwap}
            disabled={isProcessing}
            className="w-full bg-gradient-ocean text-white py-3 rounded-xl font-semibold shadow-ocean hover:shadow-ocean-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing fabric swap...
              </>
            ) : (
              <>
                <Droplets size={18} />
                Apply Fabric Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
