import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Sparkles, Upload, Palette, ShoppingBag, Star, Zap, User, Package } from 'lucide-react'
import DesignGenerator from '../components/DesignGenerator'
import DesignGallery    from '../components/DesignGallery'
import VirtualTryOn     from '../components/VirtualTryOn'
import Marketplace      from '../components/Marketplace'
import UserProfile      from '../components/UserProfile'
import Auth             from '../components/Auth'
import Header           from '../components/Header'
import TrackOrders      from '../components/Trackorders'
import LandingPage      from '../components/LandingPage'
import QuotationForm    from '../components/QuotationForm'
import toast from 'react-hot-toast'
import { useAuth }      from '../contexts/AuthContext'

const tabs = [
  { id: 'generate',    label: 'Generate',    icon: Sparkles,    color: 'sunset'  },
  { id: 'gallery',     label: 'My Gallery',  icon: Palette,     color: 'ocean'   },
  { id: 'tryon',       label: 'Try-On',      icon: Upload,      color: 'mint'    },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, color: 'gold'    },
  { id: 'orders',      label: 'Track Orders', icon: Package,     color: 'gold'    },
  { id: 'profile',     label: 'Profile',     icon: User,        color: 'fashion' },
]

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('generate')
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0)

  // Handle tab and section query parameters
  useEffect(() => {
    const tab = router.query.tab as string
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [router.query])

  // Handle garment query parameter for try-on
  useEffect(() => {
    const garment = router.query.garment as string
    const design = router.query.design as string

    if (garment) {
      let designObj = null
      try {
        designObj = design ? JSON.parse(design) : null
      } catch (e) {
        console.error('Failed to parse design object:', e)
      }

      setTryOnGarment({ url: garment, design: designObj })
      setActiveTab('tryon')
    }
  }, [router.query.garment, router.query.design])

  // Extract section from query for gallery
  const gallerySection = (router.query.section as 'my' | 'saved') || undefined

  const [showAuth, setShowAuth]         = useState(false)
  const [tryOnGarment, setTryOnGarment] = useState<{ url: string; design?: any } | null>(null)
  const [buyNowData, setBuyNowData]     = useState<{ design: any; imageUrl: string } | null>(null)

  const handleDesignGenerated = () => {
    // Increment key to force gallery refresh
    setGalleryRefreshKey(prev => prev + 1)
    // Switch to gallery tab to show the new design
    setActiveTab('gallery')
  }

  // Loading spinner while auth state is being determined

  const openTryOn = (garmentUrl: string, design?: any) => {
    setTryOnGarment({ url: garmentUrl, design })
    setActiveTab('tryon')
  }

  const handleBuyNowFromTryOn = (design: any, imageUrl: string) => {
    setBuyNowData({ design, imageUrl })
    toast.success('Complete the quotation form to place your order')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-sunset rounded-2xl flex items-center justify-center shadow-fashion mx-auto mb-4 animate-pulse-soft">
            <Sparkles className="text-white" size={28} />
          </div>
          <p className="text-gray-500 font-medium">Loading FashionFusion…</p>
        </div>
      </div>
    )
  }

  // Authenticated — always show main app regardless of showAuth
  if (isAuthenticated) {
    // fall through to main app below
  } else if (showAuth) {
    // User clicked login/signup — show auth form
    return <Auth />
  } else {
    // First visit — show landing page
    return (
      <LandingPage
        onGetStarted={() => setShowAuth(true)}
        onLogin={() => setShowAuth(true)}
        onSignUp={() => setShowAuth(true)}
      />
    )
  }

  return (
    <>
      <Head>
        <title>FashionFusion — AI-Powered Fashion Design</title>
        <meta name="description" content="Create stunning fashion designs with AI" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-fashion rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-sunset rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gradient-ocean rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Header — passes tab control so Header nav links work */}
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Hero — only on generate tab */}
          {activeTab === 'generate' && (
            <div className="text-center mb-14 animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-fashion">
                <Star className="text-fashion-gold" size={15} />
                <span className="text-sm font-medium text-gray-700">AI-Powered Fashion Design Platform</span>
                <Zap className="text-fashion-coral" size={15} />
              </div>
              <h1 className="text-6xl md:text-7xl font-display font-bold mb-5 leading-tight">
                <span className="bg-gradient-sunset bg-clip-text text-transparent">Fashion</span>
                <span className="bg-gradient-ocean bg-clip-text text-transparent">Fusion</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                Transform your fashion ideas into stunning designs with the power of AI.
              </p>
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex justify-center mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-full shadow-fashion p-1.5 flex space-x-1 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon, color }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap text-sm ${
                    activeTab === id
                      ? `bg-gradient-${color} text-white shadow-neon scale-105`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <Icon size={16} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content — only the active tab renders */}
          <div className="animate-slide-up">
            {activeTab === 'generate' && <DesignGenerator onTryOn={openTryOn} />}
            {activeTab === 'gallery' && <DesignGallery onTryOn={openTryOn} initialSection={gallerySection} />}
            {activeTab === 'tryon' && <VirtualTryOn preselectedGarmentUrl={tryOnGarment?.url} preselectedDesign={tryOnGarment?.design} onBuyNow={handleBuyNowFromTryOn} />}
            {activeTab === 'marketplace' && <Marketplace />}
            {activeTab === 'orders'      && <TrackOrders />}
            {activeTab === 'profile'     && <UserProfile />}
          </div>

          {buyNowData && (
            <QuotationForm
              design={buyNowData.design}
              imageUrl={buyNowData.imageUrl}
              onClose={() => setBuyNowData(null)}
            />
          )}
        </main>
      </div>
    </>
  )
}


