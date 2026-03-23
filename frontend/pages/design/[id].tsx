import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ChevronLeft, ChevronRight, Heart, Shirt, ShoppingBag, X, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import { designsApi, Design } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import QuotationForm from '../../components/QuotationForm'
import SmartRecolor from '../../components/SmartRecolor'

export default function DesignDetail() {
  const router = useRouter()
  const { user } = useAuth()
  const { id, from } = router.query
  
  const [design, setDesign] = useState<Design | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [quotationForm, setQuotationForm] = useState<{ design: any; imageUrl: string } | null>(null)
  const [isSavedDesign, setIsSavedDesign] = useState(from === 'saved')
  const [isMyDesign, setIsMyDesign] = useState(from === 'my')
  const [savedDesignEntry, setSavedDesignEntry] = useState<any>(null)
  const [showRecolor, setShowRecolor] = useState(false)

  const getBackRoute = () => {
    if (isSavedDesign) return '/?tab=gallery&section=saved'
    if (isMyDesign) return '/?tab=gallery&section=my'
    return '/?tab=marketplace'
  }

  useEffect(() => {
    if (id) {
      fetchDesign()
    }
  }, [id, user, from])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      } else if (event.key === 'Escape') {
        router.push(getBackRoute())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [design?.image_urls?.length])

  const fetchDesign = async () => {
    if (!id || !user) return
    
    setLoading(true)
    try {
      const data = await designsApi.getById(Number(id))
      setDesign(data)
      
      // If this is a saved design, fetch the saved design entry
      if (from === 'saved') {
        try {
          const savedDesigns = await designsApi.getSaved(user.id)
          const savedEntry = savedDesigns.find((s: any) => s.design.id === Number(id))
          if (savedEntry) {
            setSavedDesignEntry(savedEntry)
          }
        } catch (err) {
          console.error('Failed to fetch saved design entry:', err)
        }
      }
    } catch (error) {
      toast.error('Failed to load design')
      router.push('/?tab=marketplace')
    } finally {
      setLoading(false)
    }
  }

  const saveDesign = async (designId: number) => {
    if (!user) { toast.error('Sign in to save'); return }
    if (savedIds.has(designId)) { toast('Already saved!', { icon: '♥' }); return }
    try {
      await designsApi.save(designId, user.id)
      setSavedIds(prev => new Set(prev).add(designId))
      toast.success('Saved to gallery!')
    } catch (err: any) {
      if (err.status === 400) {
        setSavedIds(prev => new Set(prev).add(designId))
        toast('Already saved!', { icon: '♥' })
      } else {
        toast.error('Failed to save')
      }
    }
  }

  const unsaveDesign = async (designId: number) => {
    if (!user || !savedDesignEntry) return
    try {
      await designsApi.unsave(savedDesignEntry.saved_design_id, user.id)
      toast.success('Removed from saved')
      // If this was a saved design, go back to saved designs
      if (isSavedDesign) {
        router.push('/?tab=gallery&section=saved')
      }
    } catch (err: any) {
      toast.error('Failed to remove')
    }
  }

  const images = design?.image_urls || []
  const currentImage = images[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handleTryOn = (url: string, design: any) => {
    // Navigate to try-on with preselected garment
    router.push({
      pathname: '/',
      query: { tab: 'tryon', garment: url, design: JSON.stringify(design) }
    })
  }

  const handleRecolorComplete = (newImages: string[], totalImages: number) => {
    if (design) {
      // Update the design with new images
      setDesign({
        ...design,
        image_urls: [...design.image_urls, ...newImages]
      })
    }
    setShowRecolor(false)
    toast.success(`Added ${newImages.length} new variation(s) to design!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-sunset rounded-2xl flex items-center justify-center shadow-fashion mx-auto mb-4 animate-pulse-soft">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading design...</p>
        </div>
      </div>
    )
  }

  if (!design || !currentImage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Design not found</h2>
          <button 
            onClick={() => router.push('/?tab=marketplace')}
            className="bg-gradient-sunset text-white px-6 py-2 rounded-xl font-semibold"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(getBackRoute())}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{design.title || `Design #${design.id}`}</h1>
              <p className="text-sm text-gray-500">by {design.user?.full_name || design.user?.username || 'Anonymous'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Save/Unsave Button - Only for marketplace designs */}
            {user && !isMyDesign && (
              isSavedDesign ? (
                <button 
                  onClick={() => unsaveDesign(design.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-all"
                >
                  <Heart size={16} className="fill-red-600" />
                  Unsave Design
                </button>
              ) : (
                <button 
                  onClick={() => saveDesign(design.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-sunset text-white rounded-xl font-semibold shadow-fashion hover:shadow-fashion-lg transition-all"
                >
                  <Heart size={16} />
                  Save Design
                </button>
              )
            )}
            <span className="text-sm text-gray-500">{currentIndex + 1} / {images.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-fashion-xl overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-square">
                <img 
                  src={currentImage} 
                  alt={`${design.title} - Image ${currentIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Overlay */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all group"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Previous (←)
                      </span>
                    </button>
                    <button 
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all group"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Next (→)
                      </span>
                    </button>
                  </>
                )}

                {/* Image Counter Badge */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentIndex 
                            ? 'border-fashion-rose shadow-lg scale-105' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={url} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    onClick={() => handleTryOn(currentImage, design)}
                    className="flex items-center justify-center gap-2 py-3 bg-gradient-ocean text-white rounded-xl font-semibold shadow-ocean hover:shadow-fashion-lg transition-all"
                  >
                    <Shirt size={18} />
                    <span className="text-sm">Try On</span>
                  </button>
                  
                  <button 
                    onClick={() => setQuotationForm({ design, imageUrl: currentImage })}
                    className="flex items-center justify-center gap-2 py-3 bg-gradient-sunset text-white rounded-xl font-semibold shadow-fashion hover:shadow-fashion-lg transition-all"
                  >
                    <ShoppingBag size={18} />
                    <span className="text-sm">Order Now</span>
                  </button>
                </div>

                {/* Smart Recolor Button */}
                <button 
                  onClick={() => setShowRecolor(!showRecolor)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-fashion hover:shadow-fashion-lg transition-all"
                >
                  <Palette size={18} />
                  <span className="text-sm">Smart Recolor & Fabric Swap</span>
                </button>
              </div>
            </div>
          </div>

          {/* Smart Recolor Component */}
          {showRecolor && design && (
            <div className="mt-6">
              <SmartRecolor
                designId={design.id}
                designImage={currentImage}
                onRecolorComplete={handleRecolorComplete}
              />
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-6">
            {/* Design Info */}
            <div className="bg-white rounded-2xl shadow-fashion p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Design Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{design.prompt}</p>
                </div>

                {/* Color Palette */}
                {design.color_palette?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Color Palette</h3>
                    <div className="grid grid-cols-6 gap-2">
                      {design.color_palette.slice(0, 12).map((color: any, index: number) => (
                        <div key={index} className="text-center">
                          <div 
                            className="w-full h-12 rounded-lg shadow-sm mb-1" 
                            style={{ backgroundColor: color.hex }}
                            title={color.hex}
                          />
                          <p className="text-xs text-gray-400 font-mono truncate">{color.hex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fabric Recommendations */}
                {design.fabric_recommendations?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Recommended Fabrics</h3>
                    <div className="flex flex-wrap gap-2">
                      {design.fabric_recommendations.map((fabric: string, index: number) => (
                        <span 
                          key={index}
                          className="bg-rose-50 text-fashion-rose border border-rose-200 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {fabric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {design.created_at ? new Date(design.created_at).toLocaleDateString() : ''}</span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {design.likes_count || 0} likes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Style Recommendations */}
            {design.style_recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-fashion p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Style Recommendations</h2>
                <div className="space-y-3">
                  {design.style_recommendations.slice(0, 5).map((rec: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-700">{rec.style}</span>
                      <span className="text-xs text-fashion-mint font-semibold">
                        {Math.round((rec.similarity || 0) * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* Keyboard Shortcuts Help */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Keyboard shortcuts:</span> 
            <span className="mx-2">← → Navigate images</span>
            <span className="mx-2">ESC Back to marketplace</span>
          </p>
        </div>
      </div>
    </div>
  )
}
