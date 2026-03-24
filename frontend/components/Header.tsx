import { useState } from 'react'
import { useRouter } from 'next/router'
import { Menu, X, Sparkles, Heart, Settings, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-fashion border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onTabChange?.('generate')}>
            <div className="w-10 h-10 bg-gradient-sunset rounded-xl flex items-center justify-center shadow-fashion transform group-hover:scale-110 transition-all duration-300">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-display font-bold bg-gradient-sunset bg-clip-text text-transparent">
              FashionFusion
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {[
              { id: 'gallery',      label: 'Explore' },
              { id: 'marketplace',  label: 'Marketplace' },
              { id: 'tryon',        label: 'Try-On' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => onTabChange?.(id)}
                className={`text-sm font-medium transition-colors ${
                  activeTab === id ? 'text-fashion-rose' : 'text-gray-600 hover:text-fashion-rose'
                }`}>
                {label}
              </button>
            ))}

            {isAuthenticated && user?.is_tailor && (
              <button
                onClick={() => router.push('/tailor/dashboard')}
                className="text-sm font-medium text-gray-600 hover:text-fashion-rose transition-colors"
              >
                Tailor Portal
              </button>
            )}

            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Heart size={18} className="text-gray-500" />
              </button>

              {isAuthenticated && user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <div className="w-7 h-7 bg-gradient-sunset rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.full_name?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.full_name || user.username}
                    </span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-fashion-lg border border-gray-100 py-1 z-50 animate-slide-down">
                      <button onClick={() => { onTabChange?.('profile'); setUserMenuOpen(false) }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-fashion-rose transition-colors">
                        <User size={15} className="mr-3" /> My Profile
                      </button>
                      {user.is_tailor && (
                        <button
                          onClick={() => { router.push('/tailor/dashboard'); setUserMenuOpen(false) }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Settings size={15} className="mr-3" /> Tailor Portal
                        </button>
                      )}
                      <button className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings size={15} className="mr-3" /> Settings
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { logout(); setUserMenuOpen(false) }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={15} className="mr-3" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => onTabChange?.('auth')}
                  className="bg-gradient-sunset text-white px-5 py-2 rounded-full text-sm font-semibold shadow-fashion hover:shadow-fashion-lg transform hover:scale-105 transition-all duration-300">
                  Sign In
                </button>
              )}
            </div>
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/50 animate-slide-down space-y-3">
            {['gallery', 'marketplace', 'tryon', 'generate'].map(id => (
              <button key={id} onClick={() => { onTabChange?.(id); setIsMenuOpen(false) }}
                className="block w-full text-left px-2 py-2 text-gray-600 hover:text-fashion-rose font-medium capitalize transition-colors">
                {id === 'generate' ? 'Create Design' : id.replace('-', ' ')}
              </button>
            ))}
            {isAuthenticated && user?.is_tailor && (
              <button
                onClick={() => { router.push('/tailor/dashboard'); setIsMenuOpen(false) }}
                className="block w-full text-left px-2 py-2 text-gray-600 hover:text-fashion-rose font-medium transition-colors"
              >
                Tailor Portal
              </button>
            )}
            <div className="pt-3 border-t border-gray-200/50">
              {isAuthenticated ? (
                <button onClick={logout}
                  className="flex items-center space-x-2 text-sm text-red-500 font-medium">
                  <LogOut size={15} /> <span>Sign out</span>
                </button>
              ) : (
                <button onClick={() => { onTabChange?.('auth'); setIsMenuOpen(false) }}
                  className="bg-gradient-sunset text-white px-5 py-2 rounded-full text-sm font-semibold">
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
