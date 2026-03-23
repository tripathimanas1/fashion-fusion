import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Sparkles, Image as ImageIcon, Palette, Wand2, Download, Heart, ShoppingBag, ChevronRight, Shirt, Sliders } from 'lucide-react'
import toast from 'react-hot-toast'
import { designsApi, GeneratedDesign } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import QuotationForm from './QuotationForm'
import StyleFusion from './StyleFusion'

interface StyleBlend {
  style: string
  weight: number
}

interface DesignGeneratorProps { onTryOn?: (url: string, design: any) => void }

export default function DesignGenerator({ onTryOn }: DesignGeneratorProps) {
  const { user } = useAuth()
  const [prompt, setPrompt]                   = useState('')
  const [numOutputs, setNumOutputs]           = useState(2)
  const [referenceImage, setReferenceImage]   = useState<File | null>(null)
  const [isGenerating, setIsGenerating]       = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([])
  const [savedDesigns, setSavedDesigns] = useState<Set<number>>(new Set())
  const [quotationForm, setQuotationForm]     = useState<{ design: any; imageUrl: string } | null>(null)
  const [useStyleFusion, setUseStyleFusion]   = useState(false)
  const [styleFusion, setStyleFusion]         = useState<StyleBlend[]>([
    { style: 'modern', weight: 70 },
    { style: 'traditional', weight: 30 }
  ])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setReferenceImage(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const generateDesign = async () => {
    if (!prompt.trim()) { toast.error('Please enter a design prompt'); return }
    if (!user)          { toast.error('Please sign in first');         return }

    setIsGenerating(true)
    try {
      let result
      
      if (useStyleFusion) {
        // Use multi-style generation
        result = await designsApi.generateMultiStyle({
          prompt,
          styles: styleFusion,
          num_outputs: numOutputs,
          user_id: user.id,
          generation_type: 'multi-style'
        })
      } else {
        // Use traditional generation
        const formData = new FormData()
        formData.append('prompt', prompt)
        formData.append('generation_type', referenceImage ? 'image' : 'prompt')
        formData.append('user_id', String(user.id))
        formData.append('num_outputs', String(numOutputs))
        if (referenceImage) formData.append('reference_image', referenceImage)

        result = await designsApi.generate(formData)
      }
      
      // Ensure result has the correct structure
      const designData = result.design || result
      const imageUrls = designData.image_urls || result.image_urls || []
      
      // Prepend new result so latest appears first
      setGeneratedDesigns(prev => [designData, ...prev])
      toast.success(`${imageUrls.length} designs generated!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate design')
    } finally {
      setIsGenerating(false)
    }
  }

  const sketchToDesign = async () => {
    if (!referenceImage) { toast.error('Please upload a sketch first'); return }
    if (!user)           { toast.error('Please sign in first');         return }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('sketch', referenceImage)
      formData.append('prompt', prompt || 'fashion design')
      formData.append('user_id', String(user.id))
      formData.append('num_outputs', String(numOutputs))

      const result = await designsApi.sketchToDesign(formData)
      setGeneratedDesigns(prev => [result, ...prev])
      toast.success('Sketch converted to design!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert sketch')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveDesign = async (designId: number) => {
    if (!user) { toast.error('Sign in to save'); return }
    if (savedDesigns.has(designId)) { toast('Design already saved!', { icon: '♥' }); return }
    try {
      await designsApi.save(designId, user.id)
      setSavedDesigns(prev => new Set(prev).add(designId))
      toast.success('Design saved to gallery!')
    } catch (err: any) {
      if (err.status === 400) {
        setSavedDesigns(prev => new Set(prev).add(designId))
        toast('Design already saved!', { icon: '♥' })
      } else {
        toast.error(err.message || 'Failed to save design')
      }
    }
  }

  const suggestions = [
    'Elegant evening gown with flowing silk fabric',
    'Modern Indo-western kurta with geometric patterns',
    'Traditional saree with contemporary embroidery',
    'Athletic streetwear with sustainable materials',
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* -- Input Panel -- */}
        <div className="space-y-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion-lg p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-sunset rounded-xl flex items-center justify-center mr-4 shadow-fashion">
                <Wand2 className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold bg-gradient-sunset bg-clip-text text-transparent">
                  Create Your Design
                </h2>
                <p className="text-gray-500 text-sm">Transform ideas into stunning fashion</p>
              </div>
            </div>

            {/* Prompt */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Describe your design
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Minimalist Indo-western linen kurta with geometric embroidery and pastel colors"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fashion-rose focus:border-transparent resize-none h-28 transition-all duration-200 text-sm"
              />
            </div>

            {/* Number of designs */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of designs to generate
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumOutputs(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      numOutputs === n
                        ? 'border-fashion-rose bg-rose-50 text-fashion-rose'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Note: more designs = longer generation time (~30s each)
              </p>
            </div>

            {/* Style Fusion Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sliders size={16} className="text-purple-500" />
                  Advanced Style Fusion
                </label>
                <button
                  onClick={() => setUseStyleFusion(!useStyleFusion)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useStyleFusion ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useStyleFusion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {useStyleFusion && (
                <StyleFusion
                  enabled={useStyleFusion}
                  onStyleFusionChange={setStyleFusion}
                />
              )}
            </div>

            {/* Dropzone */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reference Image <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive ? 'border-fashion-rose bg-rose-50' : 'border-gray-200 hover:border-fashion-rose hover:bg-rose-50/30'
                }`}>
                <input {...getInputProps()} />
                <Upload className="mx-auto text-fashion-rose mb-2 opacity-70" size={28} />
                {isDragActive ? (
                  <p className="text-fashion-rose font-medium text-sm">Drop it here…</p>
                ) : referenceImage ? (
                  <div>
                    <img src={URL.createObjectURL(referenceImage)} alt="Reference"
                      className="mx-auto max-h-24 rounded-lg shadow-fashion object-cover mb-1.5" />
                    <p className="text-xs text-gray-500">{referenceImage.name} · click to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Drag & drop or click to browse</p>
                    <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={generateDesign} disabled={isGenerating}
                className="flex-1 bg-gradient-sunset text-white py-3 px-5 rounded-xl font-semibold shadow-fashion hover:shadow-fashion-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating {numOutputs} design{numOutputs > 1 ? 's' : ''}…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles size={18} /> Generate {numOutputs} Design{numOutputs > 1 ? 's' : ''}
                  </span>
                )}
              </button>
              {referenceImage && (
                <button onClick={sketchToDesign} disabled={isGenerating}
                  className="bg-gradient-ocean text-white py-3 px-5 rounded-xl font-semibold shadow-ocean hover:shadow-fashion-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none">
                  <span className="flex items-center gap-2"><ImageIcon size={16} /> Sketch</span>
                </button>
              )}
            </div>
          </div>

          {/* Prompt suggestions */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center mb-3">
              <Palette className="text-fashion-mint mr-2" size={16} />
              <h3 className="font-semibold text-gray-800 text-sm">Prompt Ideas</h3>
            </div>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)}
                className="flex items-center w-full text-left text-sm text-gray-600 hover:text-fashion-rose py-1.5 gap-2 transition-colors group">
                <ChevronRight size={12} className="text-gray-300 group-hover:text-fashion-rose flex-shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* -- Results Panel -- */}
        <div className="space-y-6">
          {generatedDesigns.length > 0 ? (
            generatedDesigns.map((design, batchIndex) => (
              <div key={design.design_id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold bg-gradient-ocean bg-clip-text text-transparent">
                    {batchIndex === 0 ? 'Latest Designs' : `Design Set ${generatedDesigns.length - batchIndex}`}
                  </h3>
                  <div className="flex items-center gap-3">
                    {/* Save Design Button */}
                    <button 
                      onClick={() => saveDesign(design.design_id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                        savedDesigns.has(design.design_id)
                          ? 'bg-rose-50 text-fashion-rose border border-rose-200'
                          : 'bg-gradient-sunset text-white shadow-fashion hover:shadow-fashion-lg'
                      }`}
                    >
                      <Heart size={14} className={savedDesigns.has(design.design_id) ? 'fill-white' : ''} />
                      {savedDesigns.has(design.design_id) ? 'Design Saved' : 'Save Design'}
                    </button>
                    <span className="text-xs text-gray-400">{design.image_urls.length} image{design.image_urls.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Images grid */}
                <div className={`grid gap-3 mb-5 ${design.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {design.image_urls.map((url, i) => {
                    const key = `${design.design_id}-${i}`
                    return (
                      <div key={i} className="relative group rounded-xl overflow-hidden shadow-fashion">
                        <img src={url} alt={`Design ${i + 1}`}
                          className="w-full aspect-square object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                          <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
                            {onTryOn && (
                              <button onClick={() => onTryOn(url, { ...design, id: design.design_id })}
                                className="flex-1 bg-white/90 backdrop-blur-sm py-1.5 rounded-lg shadow text-xs font-semibold flex items-center justify-center gap-1 hover:scale-105 transition-transform">
                                <Shirt size={11} className="text-fashion-sky" />
                                <span className="text-gray-700">Try On</span>
                              </button>
                            )}
                            <button onClick={() => setQuotationForm({ design: { ...design, id: design.design_id }, imageUrl: url })}
                              className="flex-1 bg-gradient-sunset text-white py-1.5 rounded-lg shadow text-xs font-semibold flex items-center justify-center gap-1 hover:scale-105 transition-transform">
                              <ShoppingBag size={11} />
                              <span>Order</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Color Palette */}
                {design.color_palette?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Palette size={12} /> Color Palette
                    </h4>
                    <div className="flex gap-2">
                      {design.color_palette.map((c, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div className="h-10 rounded-lg shadow-sm mb-1" style={{ backgroundColor: c.hex }} />
                          <p className="text-xs text-gray-500 font-mono">{c.hex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Style recommendations */}
                {design.style_recommendations?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Style Matches</h4>
                    <div className="flex flex-wrap gap-2">
                      {design.style_recommendations.slice(0, 3).map((r, i) => (
                        <span key={i} className="bg-rose-50 text-fashion-rose text-xs px-2.5 py-1 rounded-full">
                          {r.style} · {(r.similarity * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fabric recommendations */}
                {design.fabric_recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recommended Fabrics</h4>
                    <div className="flex flex-wrap gap-2">
                      {design.fabric_recommendations.map((f, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion-lg p-12 border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-5 animate-float shadow-ocean">
                <ImageIcon className="text-white" size={36} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Your designs will appear here</h3>
              <p className="text-gray-500 text-sm">Choose how many designs you want and enter a prompt to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Quotation Form Modal */}
      {quotationForm && (
        <QuotationForm
          design={quotationForm.design}
          imageUrl={quotationForm.imageUrl}
          onClose={() => setQuotationForm(null)}
        />
      )}
    </div>
  )
}