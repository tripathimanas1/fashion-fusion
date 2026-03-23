import React, { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, Phone, Mail, Heart, ShoppingBag, X, Package, ChevronDown, ChevronUp, Ruler, Shirt, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { marketplaceApi, Tailor } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import QuotationForm from './QuotationForm'
import { useRouter } from 'next/router'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DesignItem {
  id: number
  title: string
  prompt: string
  image_urls: string[]
  fabric_recommendations: string[]
  color_palette: any[]
  likes_count: number
  created_at: string
  user?: { username: string; full_name: string }
}

// ── Map Component ─────────────────────────────────────────────────────────────
function TailorMap({ tailors, userLat, userLng }: { tailors: Tailor[]; userLat: number; userLng: number }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L
      const map = L.map(mapRef.current).setView([userLat, userLng], 12)
      mapInstanceRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      const userIcon = L.divIcon({ html: '<div style="background:#f43f5e;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', className: '', iconAnchor: [7, 7] })
      L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindPopup('<b>You are here</b>')
      const tailorIcon = L.divIcon({ html: '<div style="background:#6366f1;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>', className: '', iconAnchor: [6, 6] })
      tailors.forEach(t => {
        const lat = userLat + (Math.random() - 0.5) * 0.1
        const lng = userLng + (Math.random() - 0.5) * 0.1
        L.marker([lat, lng], { icon: tailorIcon }).addTo(map).bindPopup(`<b>${t.name}</b><br>${t.specialization}<br>⭐ ${t.rating}`)
      })
    }
    document.head.appendChild(script)
  }, [tailors, userLat, userLng])

  return <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden shadow-fashion" />
}

// ── Location Prompt ───────────────────────────────────────────────────────────
function LocationPrompt({ onLocation }: { onLocation: (lat: number, lng: number) => void }) {
  const [manual, setManual] = useState('')
  const [loading, setLoading] = useState(false)
  const useGPS = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { onLocation(pos.coords.latitude, pos.coords.longitude); setLoading(false) },
      () => { toast.error('Could not get location'); setLoading(false) }
    )
  }
  const useManual = async () => {
    if (!manual.trim()) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manual)}&format=json&limit=1`)
      const data = await res.json()
      if (data[0]) onLocation(parseFloat(data[0].lat), parseFloat(data[0].lon))
      else toast.error('Location not found')
    } catch { toast.error('Could not geocode location') }
  }
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-8 mb-8 border border-gray-100 text-center">
      <MapPin size={40} className="text-fashion-rose mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Share your location</h3>
      <p className="text-gray-500 text-sm mb-6">To find tailors near you</p>
      <button onClick={useGPS} disabled={loading}
        className="w-full mb-3 bg-gradient-sunset text-white py-3 rounded-xl font-semibold shadow-fashion disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <div className="loading-spinner !w-5 !h-5 !border-2" /> : <MapPin size={18} />}
        Use My Current Location
      </button>
      <div className="flex items-center gap-3 mb-3"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-200" /></div>
      <div className="flex gap-2">
        <input type="text" placeholder="Enter city or address…" value={manual}
          onChange={e => setManual(e.target.value)} onKeyDown={e => e.key === 'Enter' && useManual()}
          className="form-input flex-1" />
        <button onClick={useManual} className="px-4 py-2 bg-gradient-ocean text-white rounded-xl font-semibold shadow-ocean">Search</button>
      </div>
    </div>
  )
}

// ── Main Marketplace ──────────────────────────────────────────────────────────
export default function Marketplace() {
  const { user } = useAuth()
  const router = useRouter()
  const [designs, setDesigns]             = useState<DesignItem[]>([])
  const [savedIds, setSavedIds]           = useState<Set<number>>(new Set())
  const [tailors, setTailors]             = useState<Tailor[]>([])
  const [loading, setLoading]             = useState(true)
  const [searchDesign, setSearchDesign]   = useState('')
  const [searchTailor, setSearchTailor]   = useState('')
  const [location, setLocation]           = useState<{ lat: number; lng: number } | null>(null)
  const [activeSection, setActiveSection] = useState<'designs' | 'tailors'>('designs')
  const [quotationForm, setQuotationForm] = useState<{ design: DesignItem; imageUrl: string } | null>(null)

  useEffect(() => { fetchDesigns() }, [])

  const saveDesign = async (designId: number) => {
    if (!user) { toast.error('Sign in to save'); return }
    if (savedIds.has(designId)) { toast('Already saved!', { icon: '♥' }); return }
    try {
      const res = await fetch(`${API_URL}/api/v1/designs/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ design_id: designId, user_id: user.id }),
      })
      if (res.ok) { setSavedIds(prev => new Set(prev).add(designId)); toast.success('Design saved to gallery!') }
      else if (res.status === 400) { setSavedIds(prev => new Set(prev).add(designId)); toast('Already saved!', { icon: '♥' }) }
    } catch { toast.error('Failed to save') }
  }

  useEffect(() => { if (location) fetchTailors(location.lat, location.lng) }, [location])

  const fetchDesigns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/designs/public`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDesigns(Array.isArray(data) ? data : [])
      }
    } catch { } finally { setLoading(false) }
  }

  const fetchTailors = async (lat: number, lng: number) => {
    try {
      const data = await marketplaceApi.getTailors(lat, lng)
      setTailors(Array.isArray(data) ? data : [])
    } catch { }
  }

  const handleViewDesign = (design: DesignItem) => {
    router.push(`/design/${design.id}`)
  }

  const filteredDesigns = designs.filter(d =>
    !searchDesign ||
    d.title?.toLowerCase().includes(searchDesign.toLowerCase()) ||
    d.prompt?.toLowerCase().includes(searchDesign.toLowerCase())
  )

  const filteredTailors = tailors.filter(t =>
    !searchTailor ||
    t.name?.toLowerCase().includes(searchTailor.toLowerCase()) ||
    t.location?.toLowerCase().includes(searchTailor.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(searchTailor.toLowerCase())
  )

  if (loading) return <div className="flex justify-center items-center h-64"><div className="loading-spinner" /></div>

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Quotation Form Modal */}
      {quotationForm && (
        <QuotationForm
          design={quotationForm.design}
          imageUrl={quotationForm.imageUrl}
          onClose={() => setQuotationForm(null)}
        />
      )}

      {/* Section tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-4 mb-8 border border-gray-100">
        <div className="flex gap-2">
          {([['designs', 'All Designs', ShoppingBag], ['tailors', 'Nearby Tailors', MapPin]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveSection(id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeSection === id ? 'bg-gradient-sunset text-white shadow-fashion' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── All Designs (Amazon Grid Layout) ── */}
      {activeSection === 'designs' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <h2 className="text-xl font-display font-bold text-gray-900">
              Results <span className="text-sm font-normal text-gray-400 ml-2">({filteredDesigns.length} items)</span>
            </h2>
            <div className="relative sm:ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search designs…" value={searchDesign}
                onChange={e => setSearchDesign(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fashion-rose" />
            </div>
          </div>

          {filteredDesigns.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-12 text-center border border-gray-100">
              <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">No public designs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigns.map(d => {
                const imgs = Array.isArray(d.image_urls) ? d.image_urls : []
                const mainImage = imgs.length > 0 ? imgs[0] : '/placeholder-design.jpg'

                return (
                  <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    
                    {/* Image Area */}
                    <div className="relative aspect-square w-full bg-gray-50 group">
                      <img 
                        src={mainImage} 
                        alt={d.title} 
                        className="w-full h-full object-cover"
                      />
                      {imgs.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md">
                          +{imgs.length - 1} more
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 min-h-[40px]">
                        {d.title || `Design #${d.id}`}
                      </h3>
                      
                      <p className="text-xs text-gray-500 mb-3">
                        by {d.user?.full_name || d.user?.username || 'Anonymous'}
                      </p>

                      {/* Color Palette Swatches */}
                      {d.color_palette?.length > 0 && (
                        <div className="flex gap-1 mb-4">
                          {d.color_palette.slice(0, 4).map((c: any, i: number) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                              style={{ backgroundColor: c.hex }} title={c.hex} />
                          ))}
                        </div>
                      )}

                      {/* Amazon-style Buttons */}
                      <div className="mt-auto">
                        <button 
                          onClick={() => handleViewDesign(d)}
                          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black text-xs font-bold py-2.5 rounded-full transition-colors shadow-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Nearby Tailors ── */}
      {activeSection === 'tailors' && (
        <>
          {!location ? (
            <LocationPrompt onLocation={(lat, lng) => setLocation({ lat, lng })} />
          ) : (
            <>
              <div className="mb-6"><TailorMap tailors={tailors} userLat={location.lat} userLng={location.lng} /></div>
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Filter tailors…" value={searchTailor}
                    onChange={e => setSearchTailor(e.target.value)} className="form-input pl-9" />
                </div>
                <button onClick={() => setLocation(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                  <MapPin size={14} /> Change
                </button>
              </div>
              {filteredTailors.length === 0 ? (
                <div className="bg-white/80 rounded-2xl p-12 text-center border border-gray-100">
                  <MapPin size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-500 text-sm">No tailors found nearby.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTailors.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl shadow-fashion p-5 hover:shadow-fashion-lg transition-all border border-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{t.name}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{t.location}
                            {t.distance_km && <span className="text-fashion-rose ml-1">({t.distance_km}km)</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-semibold text-sm">
                            <Star size={13} className="text-yellow-500 fill-yellow-500" />{t.rating.toFixed(1)}
                          </div>
                          <p className="text-xs text-gray-400">{t.experience_years}yr exp</p>
                        </div>
                      </div>
                      <span className="inline-block px-3 py-1 bg-rose-50 text-fashion-rose rounded-full text-xs font-medium mb-3">{t.specialization}</span>
                      {t.bio && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.bio}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => marketplaceApi.contactTailor(t.id, user?.id ?? 0, 'I am interested')}
                          className="flex-1 bg-gradient-sunset text-white py-2 px-3 rounded-xl text-sm font-semibold shadow-fashion hover:shadow-fashion-lg transition-all flex items-center justify-center gap-1.5">
                          <Phone size={13} /> Contact
                        </button>
                        <button title={t.email} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                          <Mail size={15} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}