import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, User, Shirt, Camera, RotateCcw, Heart, ShoppingBag, Sparkles, Check, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { designsApi, Design, SavedDesignEntry } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface VirtualTryOnProps {
  preselectedGarmentUrl?: string   // passed when navigating from gallery/marketplace
  preselectedDesign?: any          // full design object for Buy Now flow
  onBuyNow?: (design: any, imageUrl: string) => void
  onTabChange?: (tab: string) => void
}

export default function VirtualTryOn({
  preselectedGarmentUrl,
  preselectedDesign,
  onBuyNow,
  onTabChange,
}: VirtualTryOnProps) {
  const { user } = useAuth()

  // Images
  const [bodyImage, setBodyImage]       = useState<File | null>(null)
  const [garmentImage, setGarmentImage] = useState<File | null>(null)
  const [garmentUrl, setGarmentUrl]     = useState<string | null>(preselectedGarmentUrl || null)
  const [activeGarmentUrl, setActiveGarmentUrl] = useState<string | null>(preselectedGarmentUrl || null)

  // Results
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultImage, setResultImage]   = useState<string | null>(null)
  const [resultLiked, setResultLiked]   = useState(false)

  // Design picker
  const [savedDesigns, setSavedDesigns] = useState<SavedDesignEntry[]>([])
  const [pickerTab, setPickerTab]       = useState<'my' | 'saved' | 'upload'>('upload')
  const [loadingDesigns, setLoadingDesigns] = useState(false)

  // Selected design for Buy Now
  const [selectedDesignForBuy, setSelectedDesignForBuy] = useState<any>(preselectedDesign || null)

  // Fetch user's designs when picker opens
  useEffect(() => {
    if (user?.id && pickerTab === 'saved') {
      fetchDesigns()
    }
  }, [pickerTab, user?.id])

  // Sync with preselectedGarmentUrl when it changes
  // Using a ref to detect actual changes vs initial mount
  useEffect(() => {
    if (preselectedGarmentUrl) {
      setGarmentUrl(preselectedGarmentUrl)
      setActiveGarmentUrl(preselectedGarmentUrl)
      setGarmentImage(null)
      setPickerTab('upload')
      setResultImage(null) // clear previous result when new garment is preselected
    }
  }, [preselectedGarmentUrl])

  const fetchDesigns = async () => {
    if (!user) return
    setLoadingDesigns(true)
    try {
      const saved = await designsApi.getSaved(user.id)
      setSavedDesigns(Array.isArray(saved) ? saved : [])
    } catch { }
    finally { setLoadingDesigns(false) }
  }

  // Dropzones
  const onBodyDrop = useCallback((files: File[]) => {
    if (files[0]) setBodyImage(files[0])
  }, [])

  const onGarmentDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setGarmentImage(files[0])
      setGarmentUrl(null)
      setSelectedDesignForBuy(null)
    }
  }, [])

  const { getRootProps: getBodyRootProps,    getInputProps: getBodyInputProps }    = useDropzone({ onDrop: onBodyDrop,    accept: { 'image/*': [] }, maxFiles: 1 })
  const { getRootProps: getGarmentRootProps, getInputProps: getGarmentInputProps } = useDropzone({ onDrop: onGarmentDrop, accept: { 'image/*': [] }, maxFiles: 1 })

  const selectDesignImage = (imageUrl: string, design: any) => {
    setGarmentUrl(imageUrl)
    setGarmentImage(null)
    setSelectedDesignForBuy(design)
  }

  const processTryOn = async () => {
    if (!bodyImage) { toast.error('Please upload your body photo'); return }
    if (!garmentImage && !garmentUrl) { toast.error('Please select or upload a garment image'); return }

    setIsProcessing(true)
    setResultImage(null)
    setResultLiked(false)

    try {
      const formData = new FormData()
      formData.append('body_image', bodyImage)

      if (garmentImage) {
        // Upload file directly
        formData.append('garment_image', garmentImage)
        const res = await fetch(`${API_URL}/api/v1/tryon/virtual-tryon`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Try-on failed')
        setResultImage(data.tryon_result_url)
      } else if (garmentUrl) {
        // Send garment as URL
        formData.append('garment_url', garmentUrl)
        const res = await fetch(`${API_URL}/api/v1/tryon/virtual-tryon-url`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Try-on failed')
        setResultImage(data.tryon_result_url)
      }

      toast.success('Virtual try-on complete!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to process try-on')
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setBodyImage(null)
    setGarmentImage(null)
    setGarmentUrl(null)
    setActiveGarmentUrl(null)
    setResultImage(null)
    setResultLiked(false)
    setSelectedDesignForBuy(null)
  }

  const handleBuyNow = () => {
    if (onBuyNow && selectedDesignForBuy && garmentUrl) {
      onBuyNow(selectedDesignForBuy, garmentUrl)
    } else if (onTabChange) {
      onTabChange('marketplace')
      toast('Select a design in the Marketplace to place an order', { icon: '🛍️' })
    }
  }

  const garmentPreviewUrl = garmentImage ? URL.createObjectURL(garmentImage) : garmentUrl

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Inputs ── */}
        <div className="space-y-6">

          {/* Body Image */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-sunset rounded-lg flex items-center justify-center">
                <User className="text-white" size={14} />
              </div>
              Step 1 — Your Body Photo
            </h3>
            <div {...getBodyRootProps()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                bodyImage ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-fashion-rose hover:bg-rose-50/30'
              }`}>
              <input {...getBodyInputProps()} />
              {bodyImage ? (
                <div>
                  <img src={URL.createObjectURL(bodyImage)} alt="Body"
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-2 shadow-fashion" />
                  <p className="text-green-600 font-medium text-sm">{bodyImage.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto text-gray-300 mb-2" size={36} />
                  <p className="text-gray-600 text-sm font-medium">Upload full-body photo</p>
                  <p className="text-gray-400 text-xs mt-1">Standing pose · clear background works best</p>
                </div>
              )}
            </div>
          </div>

          {/* Garment Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-ocean rounded-lg flex items-center justify-center">
                <Shirt className="text-white" size={14} />
              </div>
              Step 2 — Choose Garment
            </h3>

            {/* Source tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'upload', label: 'Upload Image' },
                { id: 'saved',  label: 'Saved Designs' },
              ].map(t => (
                <button key={t.id} onClick={() => setPickerTab(t.id as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pickerTab === t.id
                      ? 'bg-gradient-ocean text-white shadow-ocean'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Upload tab */}
            {pickerTab === 'upload' && (
              <div>
                {preselectedGarmentUrl && garmentUrl ? (
                  // Pre-selected from gallery/marketplace
                  <div className="text-center">
                    <img src={garmentUrl} alt="Selected garment"
                      className="w-32 h-32 object-cover rounded-xl mx-auto mb-2 shadow-fashion" />
                    <p className="text-green-600 font-medium text-sm">Design selected from gallery</p>
                    <button onClick={() => { setGarmentUrl(null); setSelectedDesignForBuy(null) }}
                      className="text-xs text-gray-400 hover:text-fashion-rose mt-1 underline">
                      Change
                    </button>
                  </div>
                ) : (
                  <div {...getGarmentRootProps()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      garmentImage ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-fashion-rose hover:bg-rose-50/30'
                    }`}>
                    <input {...getGarmentInputProps()} />
                    {garmentImage ? (
                      <div>
                        <img src={URL.createObjectURL(garmentImage)} alt="Garment"
                          className="w-32 h-32 object-cover rounded-xl mx-auto mb-2 shadow-fashion" />
                        <p className="text-green-600 font-medium text-sm">{garmentImage.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto text-gray-300 mb-2" size={36} />
                        <p className="text-gray-600 text-sm font-medium">Upload garment image</p>
                        <p className="text-gray-400 text-xs mt-1">Front-facing · clear background</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Saved Designs tab */}
            {pickerTab === 'saved' && (
              <div>
                {loadingDesigns ? (
                  <div className="flex justify-center py-8"><div className="loading-spinner" /></div>
                ) : savedDesigns.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No saved designs yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {savedDesigns.flatMap(s =>
                      (Array.isArray(s.design.image_urls) ? s.design.image_urls : []).map((url, i) => ({
                        url, design: s.design, key: `${s.saved_design_id}-${i}`
                      }))
                    ).map(({ url, design, key }) => (
                      <button key={key} onClick={() => selectDesignImage(url, design)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          garmentUrl === url ? 'border-fashion-rose shadow-fashion' : 'border-transparent hover:border-gray-300'
                        }`}>
                        <img src={url} alt="" className="w-full h-20 object-cover" />
                        {garmentUrl === url && (
                          <div className="absolute inset-0 bg-fashion-rose/20 flex items-center justify-center">
                            <Check size={16} className="text-fashion-rose bg-white rounded-full p-0.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={processTryOn}
              disabled={isProcessing || !bodyImage || (!garmentImage && !garmentUrl)}
              className="flex-1 bg-gradient-sunset text-white py-3.5 rounded-xl font-bold shadow-fashion hover:shadow-fashion-lg transform hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2">
              {isProcessing ? (
                <><div className="loading-spinner !w-5 !h-5 !border-2" /> Processing…</>
              ) : (
                <><Camera size={18} /> Try On</>
              )}
            </button>
            <button onClick={reset}
              className="px-5 py-3.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-colors flex items-center gap-2">
              <RotateCcw size={16} /> Reset
            </button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">Tips for best results:</p>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• Full-body photo with arms slightly away from body</li>
              <li>• Simple, neutral background for body photo</li>
              <li>• Clear, front-facing garment image</li>
              <li>• Good lighting on both images</li>
            </ul>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-mint rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={14} />
              </div>
              Result
            </h3>

            {resultImage ? (
              <div className="space-y-4">
                <img src={resultImage} alt="Virtual try-on result"
                  className="w-full rounded-xl shadow-fashion object-contain bg-gray-50" />

                {/* Action buttons */}
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100 space-y-2">
                  <p className="font-bold text-gray-900 text-center mb-3">Like how it looks?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResultLiked(true); toast.success('Result saved!') }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                        resultLiked ? 'border-fashion-rose bg-rose-50 text-fashion-rose' : 'border-gray-200 text-gray-600 hover:border-fashion-rose hover:bg-rose-50'
                      }`}>
                      <Heart size={14} className={resultLiked ? 'fill-fashion-rose text-fashion-rose' : ''} />
                      {resultLiked ? 'Saved!' : 'Save Result'}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-gradient-sunset text-white py-2.5 rounded-xl font-bold text-sm shadow-fashion hover:shadow-fashion-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5">
                      <ShoppingBag size={14} /> Order Now
                    </button>
                  </div>
                  <button
                    onClick={() => { setResultImage(null); setResultLiked(false) }}
                    className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-fashion-sky hover:text-fashion-sky text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                    <Shirt size={12} /> Try Another Garment
                  </button>
                  {!selectedDesignForBuy && (
                    <p className="text-xs text-gray-400 text-center">
                      Select a design from My Designs or Saved tab to enable Order Now
                    </p>
                  )}
                </div>

                {/* Download */}
                <a href={resultImage} download="tryon-result.png"
                  className="block w-full text-center text-sm text-gray-400 hover:text-fashion-rose transition-colors py-2">
                  ↓ Download result image
                </a>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gradient-mint rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-mint animate-float">
                  <Camera className="text-white" size={28} />
                </div>
                <h4 className="font-semibold text-gray-600 mb-1">No result yet</h4>
                <p className="text-gray-400 text-sm max-w-48">
                  Upload your photo and select a garment to see the virtual try-on
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}