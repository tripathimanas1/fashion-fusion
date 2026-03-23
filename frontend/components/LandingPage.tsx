import { useState } from 'react'
import { Sparkles, Wand2, ShoppingBag, Shirt, Users, Star, ArrowRight, Check, Menu, X, Palette, Scissors, MapPin } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
  onLogin: () => void
  onSignUp: () => void
}

export default function LandingPage({ onGetStarted, onLogin, onSignUp }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: Wand2,
      title: 'AI Design Generation',
      desc: 'Describe your dream outfit in plain words. Our AI generates stunning, wearable fashion designs in seconds.',
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50',
    },
    {
      icon: Palette,
      title: 'Color & Fabric Intelligence',
      desc: 'Automatically extracts your design\'s color palette and recommends the perfect fabrics to bring it to life.',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
    },
    {
      icon: Shirt,
      title: 'Virtual Try-On',
      desc: 'See how a garment looks on you before it\'s even made. Upload your photo and try on any design instantly.',
      color: 'from-sky-500 to-blue-500',
      bg: 'bg-sky-50',
    },
    {
      icon: MapPin,
      title: 'Find Nearby Tailors',
      desc: 'Connect with skilled tailors near you. Browse profiles, compare ratings, and find your perfect match.',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
    },
    {
      icon: ShoppingBag,
      title: 'Quotation Marketplace',
      desc: 'Send your design to multiple tailors at once. Receive competing quotes and choose the best price.',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
    },
    {
      icon: Scissors,
      title: 'Order Tracking',
      desc: 'Track your order from quotation to delivery. Stay updated at every step of the tailoring process.',
      color: 'from-fuchsia-500 to-pink-500',
      bg: 'bg-fuchsia-50',
    },
  ]

  const steps = [
    { num: '01', title: 'Describe your design', desc: 'Type a prompt like "elegant silk kurta with floral embroidery" or upload a sketch.' },
    { num: '02', title: 'AI generates designs', desc: 'Get multiple AI-generated design variations with color palettes and fabric suggestions.' },
    { num: '03', title: 'Send to tailors', desc: 'Choose your favourite image and send a quotation request to all nearby tailors at once.' },
    { num: '04', title: 'Compare & confirm', desc: 'Receive price quotes, compare tailors, and confirm your order — all in one place.' },
  ]

  const stats = [
    { value: '10,000+', label: 'Designs Generated' },
    { value: '500+',    label: 'Active Tailors' },
    { value: '4.9★',    label: 'Average Rating' },
    { value: '98%',     label: 'Customer Satisfaction' },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-fashion">
                <Sparkles className="text-white" size={18} />
              </div>
              <span className="text-xl font-display font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                FashionFusion
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-rose-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-rose-600 transition-colors font-medium">How It Works</a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-rose-600 transition-colors font-medium">Reviews</a>
              <button onClick={onLogin}
                className="text-sm font-semibold text-gray-700 hover:text-rose-600 transition-colors px-4 py-2 rounded-xl hover:bg-rose-50">
                Log In
              </button>
              <button onClick={onSignUp}
                className="text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-2.5 rounded-xl shadow-fashion hover:shadow-fashion-lg transform hover:scale-105 transition-all">
                Sign Up Free
              </button>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3 animate-slide-down">
              <a href="#features" className="block text-sm text-gray-600 py-2 font-medium">Features</a>
              <a href="#how-it-works" className="block text-sm text-gray-600 py-2 font-medium">How It Works</a>
              <div className="flex gap-3 pt-2">
                <button onClick={onLogin}
                  className="flex-1 text-sm font-semibold text-gray-700 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Log In
                </button>
                <button onClick={onSignUp}
                  className="flex-1 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 py-2.5 rounded-xl shadow-fashion">
                  Sign Up Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-100 rounded-full filter blur-3xl opacity-40 -translate-y-1/2" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-pink-100 rounded-full filter blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-100 rounded-full filter blur-3xl opacity-30" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
            <Sparkles size={12} />
            AI-Powered Fashion Design Platform
            <Sparkles size={12} />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 tracking-tight">
            Your Dream Outfit,
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                Designed by AI
              </span>
              {/* Underline decoration */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8 C75 2, 150 11, 300 5" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f43f5e"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe any outfit, get beautiful AI-generated designs, and connect with skilled local tailors to bring your vision to life — all in minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button onClick={onSignUp}
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-fashion hover:shadow-fashion-lg transform hover:scale-105 transition-all">
              Start Creating Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onGetStarted}
              className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-rose-300 hover:bg-rose-50 transition-all">
              See How It Works
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex -space-x-2">
              {['🧑🏻', '👩🏽', '🧑🏿', '👩🏼', '🧑🏾'].map((e, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 border-2 border-white flex items-center justify-center text-sm shadow-sm">
                  {e}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">2,400+</span> designers & fashion lovers
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
              <span className="text-sm text-gray-500 ml-1">4.9/5</span>
            </div>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="max-w-4xl mx-auto mt-16 relative">
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-6 border border-rose-100 shadow-fashion-xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  prompt: 'Minimalist white linen kurta', 
                  color: 'from-stone-200 to-gray-300',
                  image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop&auto=format',
                  colors: ['#f8f9fa', '#e9ecef', '#dee2e6']
                },
                { 
                  prompt: 'Silk evening gown with floral print', 
                  color: 'from-rose-200 to-pink-300',
                  image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=300&fit=crop&auto=format',
                  colors: ['#fce4ec', '#f8bbd9', '#f48fb1']
                },
                { 
                  prompt: 'Modern indo-western suit', 
                  color: 'from-indigo-200 to-violet-300',
                  image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop&auto=format',
                  colors: ['#e8eaf6', '#c5cae9', '#9fa8da']
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-fashion group cursor-pointer hover:shadow-fashion-lg transition-all hover:-translate-y-1 border border-gray-100">
                  <div className="h-36 relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 line-clamp-2">{item.prompt}</p>
                    <div className="flex gap-1 mt-2">
                      {item.colors.map((c, j) => (
                        <div key={j} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-fashion">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wand2 className="text-white" size={18} />
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded-full w-3/4 mb-2" />
                <div className="h-2 bg-gray-50 rounded-full w-1/2" />
              </div>
              <div className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full">Generate</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-gradient-to-r from-rose-500 to-pink-600">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-display font-bold text-white mb-1">{s.value}</p>
              <p className="text-rose-100 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-500 text-sm font-bold uppercase tracking-widest">Everything You Need</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mt-3 mb-4">
              Powerful Features
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From AI design generation to tailor discovery — everything to turn your fashion idea into reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i}
                  className="bg-white rounded-2xl p-6 shadow-fashion hover:shadow-fashion-lg transition-all hover:-translate-y-1 border border-gray-100 group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-fashion group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={22} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-500 text-sm font-bold uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mt-3 mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From idea to tailored garment in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all group">
                <div className="text-4xl font-display font-bold text-rose-100 group-hover:text-rose-200 transition-colors flex-shrink-0 leading-none">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-500 text-sm font-bold uppercase tracking-widest">Loved By Users</span>
            <h2 className="text-4xl font-display font-bold text-gray-900 mt-3">What People Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya S.', role: 'Fashion Designer', text: 'FashionFusion completely changed how I work with clients. I can visualize designs instantly and connect with the best tailors.',  stars: 5 },
              { name: 'Rahul M.', role: 'Tailor, Mumbai',   text: 'As a tailor, I now get detailed design requests with measurements and fabric suggestions. My orders increased 3x!', stars: 5 },
              { name: 'Ananya K.', role: 'Student',         text: 'I designed my graduation outfit using FashionFusion. The AI understood exactly what I wanted. Amazing experience!', stars: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-fashion border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full filter blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Ready to Create?
          </h2>
          <p className="text-rose-100 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of designers, fashion lovers, and tailors on FashionFusion. Free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onSignUp}
              className="group flex items-center justify-center gap-2 bg-white text-rose-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-fashion-xl hover:shadow-fashion-xl transform hover:scale-105 transition-all">
              Create Free Account
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onLogin}
              className="flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
              Log In
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {['No credit card required', 'Free forever plan', '2-minute setup'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-rose-100 text-sm">
                <Check size={14} className="text-white" /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={15} />
            </div>
            <span className="font-display font-bold text-white text-lg">FashionFusion</span>
          </div>
          <p className="text-sm">© 2026 FashionFusion. AI-Powered Fashion Design Platform.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}