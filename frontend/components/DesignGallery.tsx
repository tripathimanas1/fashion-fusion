import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Heart, Search, Shirt, ShoppingBag, X, ChevronLeft, ChevronRight, Palette, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { designsApi, Design, SavedDesignEntry } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface DesignGalleryProps {
  onTryOn?: (url: string, design: any) => void
  initialSection?: 'my' | 'saved'
}

// ── Fullscreen Image Viewer ────────────────────────────────────────────────────
function ImageViewer({ design, initialIndex, isSaved, savedDesignId, onClose, onTryOn, onUnsave, showMode, onOrderNow }: {
  design: any
  initialIndex: number
  isSaved?: boolean
  savedDesignId?: number
  onClose: () => void
  onTryOn?: (url: string, design: any) => void
  onUnsave?: () => void
  showMode: 'my' | 'saved'
  onOrderNow: (design: any, imageUrl: string) => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const imgs = Array.isArray(design.image_urls) ? design.image_urls : []
  const url = imgs[idx] || ''

  const prev = () => setIdx(i => (i - 1 + imgs.length) % imgs.length)
  const next = () => setIdx(i => (i + 1) % imgs.length)

  // keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [imgs.length])

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div>
          <h3 className="text-white font-bold text-lg">{design.title || `Design #${design.id}`}</h3>
          <p className="text-gray-400 text-sm">{idx + 1} / {imgs.length}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <X size={22} className="text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative px-16 min-h-0">
        {/* Prev */}
        {imgs.length > 1 && (
          <button onClick={prev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <ChevronLeft size={24} className="text-white" />
          </button>
        )}

        <img src={url} alt={design.title || ''}
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl" />

        {/* Next */}
        {imgs.length > 1 && (
          <button onClick={next}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {imgs.length > 1 && (
        <div className="flex justify-center gap-2 py-3">
          {imgs.map((_: any, i: number) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 px-6 pb-6 pt-2 flex-shrink-0 max-w-lg mx-auto w-full">
        {onTryOn && (
          <button onClick={() => { onTryOn(url, design); onClose() }}
            className="flex-1 bg-gradient-ocean text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-ocean hover:shadow-fashion-lg transition-all">
            <Shirt size={18} /> Try On
          </button>
        )}
        {onOrderNow && (
          <button onClick={() => { onOrderNow(design, url); onClose() }}
            className="flex-1 bg-gradient-sunset text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-fashion hover:shadow-fashion-lg transition-all">
            <ShoppingBag size={18} /> Order Now
          </button>
        )}
        {showMode === 'saved' && onUnsave && (
          <button onClick={() => { onUnsave(); onClose() }}
            className="px-4 py-3 border-2 border-red-400 text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
            <X size={18} /> Unsave
          </button>
        )}
      </div>

      {/* Prompt */}
      {design.prompt && (
        <p className="text-center text-gray-500 text-xs pb-4 px-8 line-clamp-1">{design.prompt}</p>
      )}
    </div>
  )
}

// ── Design Group Card ─────────────────────────────────────────────────────────
function DesignGroupCard({ design, onOpen }: {
  design: any
  onOpen: (design: any, index: number) => void
}) {
  const imgs = Array.isArray(design.image_urls) ? design.image_urls : []
  if (!imgs[0]) return null

  return (
    <div className="bg-white rounded-2xl shadow-fashion hover:shadow-fashion-lg transition-all hover:-translate-y-1 overflow-hidden cursor-pointer group"
      onClick={() => onOpen(design, 0)}>
      {/* Main image */}
      <div className="relative h-56 overflow-hidden">
        <img src={imgs[0]} alt={design.title || ''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {/* Image count badge */}
        {imgs.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            1/{imgs.length}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="font-semibold text-sm truncate">{design.title || `Design #${design.id}`}</p>
            <p className="text-xs opacity-75 mt-0.5">Tap to view all {imgs.length} image{imgs.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Thumbnail strip for multi-image designs */}
      {imgs.length > 1 && (
        <div className="flex gap-1.5 p-3">
          {imgs.slice(0, 4).map((url: string, i: number) => (
            <div key={i} onClick={e => { e.stopPropagation(); onOpen(design, i) }}
              className="flex-1 h-12 rounded-lg overflow-hidden hover:ring-2 hover:ring-fashion-rose transition-all">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Bottom info */}
      <div className="px-4 pb-4">
        <p className="text-gray-500 text-xs line-clamp-2 mb-2">{design.prompt}</p>
        {design.color_palette?.length > 0 && (
          <div className="flex gap-1">
            {design.color_palette.slice(0, 5).map((c: any, i: number) => (
              <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Gallery ──────────────────────────────────────────────────────────────
export default function DesignGallery({ onTryOn, initialSection }: DesignGalleryProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [myDesigns, setMyDesigns]       = useState<Design[]>([])
  const [savedDesigns, setSavedDesigns] = useState<SavedDesignEntry[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchTerm, setSearchTerm]     = useState('')
  const [activeTab, setActiveTab]       = useState<'my' | 'saved'>(initialSection || 'my')

  useEffect(() => { if (user?.id) fetchAll() }, [user?.id])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [mine, saved] = await Promise.allSettled([
        designsApi.getByUser(user.id),
        designsApi.getSaved(user.id),
      ])
      if (mine.status  === 'fulfilled') setMyDesigns(Array.isArray(mine.value)  ? mine.value  : [])
      if (saved.status === 'fulfilled') setSavedDesigns(Array.isArray(saved.value) ? saved.value : [])
    } catch { toast.error('Failed to load designs') }
    finally { setLoading(false) }
  }

  const unsaveDesign = async (savedDesignId: number, designId: number) => {
    if (!user) return
    try {
      await designsApi.unsave(savedDesignId, user.id)
      setSavedDesigns(prev => prev.filter(s => s.saved_design_id !== savedDesignId))
      toast.success('Removed from saved')
    } catch { toast.error('Failed to remove') }
  }

  const filteredMy = myDesigns.filter(d =>
    !searchTerm ||
    d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSaved = savedDesigns.filter(s =>
    !searchTerm ||
    s.design.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.design.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner" /></div>

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-5 mb-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-display font-bold text-gray-900">My Gallery</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search designs…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fashion-rose" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-4">
          <button onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'my' ? 'bg-gradient-sunset text-white shadow-fashion' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <Palette size={15} /> My Designs
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'my' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {myDesigns.length}
            </span>
          </button>
          <button onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'saved' ? 'bg-gradient-ocean text-white shadow-ocean' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <Bookmark size={15} /> Saved Designs
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {savedDesigns.length}
            </span>
          </button>
        </div>
      </div>

      {/* My Designs */}
      {activeTab === 'my' && (
        filteredMy.length > 0 ? (
          <div className="image-gallery">
            {filteredMy.map(design => (
              <DesignGroupCard
                key={design.id}
                design={design}
                onOpen={(d) => router.push(`/design/${d.id}?from=my`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 rounded-2xl shadow-fashion p-12 text-center border border-gray-100">
            <Palette size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No designs yet</h3>
            <p className="text-gray-400 text-sm">Generate your first AI fashion design to see it here</p>
          </div>
        )
      )}

      {/* Saved Designs */}
      {activeTab === 'saved' && (
        filteredSaved.length > 0 ? (
          <div className="image-gallery">
            {filteredSaved.map(entry => (
              <DesignGroupCard
                key={entry.saved_design_id}
                design={entry.design}
                onOpen={(d) => router.push(`/design/${d.id}?from=saved`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 rounded-2xl shadow-fashion p-12 text-center border border-gray-100">
            <Heart size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No saved designs</h3>
            <p className="text-gray-400 text-sm">Click the heart button on any design to save it here</p>
          </div>
        )
      )}
    </div>
  )
}