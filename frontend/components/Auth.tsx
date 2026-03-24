import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, AtSign, Briefcase, Building, Star } from 'lucide-react'
import { authApi, ApiError } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const Auth: React.FC = () => {
  const { login } = useAuth()
  const [isLogin, setIsLogin]         = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [successMsg, setSuccessMsg]   = useState('')

  const [formData, setFormData] = useState({
    email:     '',
    username:  '',
    password:  '',
    full_name: '',
    phone:     '',
    location:  '',
    is_tailor: false,
    business_name: '',
    business_type: 'tailor' as 'tailor' | 'designer' | 'both',
    specialties: '',
    experience_years: '',
    business_address: '',
    business_phone: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    })
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      if (isLogin) {
        const { access_token } = await authApi.login(formData.email, formData.password)
        await login(access_token)
        // AuthContext now drives navigation — index.tsx will show main app
      } else {
        const registrationData = {
          email:     formData.email,
          username:  formData.username,
          password:  formData.password,
          full_name: formData.full_name,
          phone:     formData.phone || undefined,
          location:  formData.location || undefined,
          is_tailor: formData.is_tailor,
          ...(formData.is_tailor && {
            business_name: formData.business_name,
            business_type: formData.business_type,
            specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
            experience_years: parseInt(formData.experience_years) || 0,
            business_address: formData.business_address,
            business_phone: formData.business_phone,
          })
        }
        await authApi.register(registrationData)
        setSuccessMsg('Account created! Please sign in.')
        setIsLogin(true)
        setFormData(f => ({ ...f, password: '', is_tailor: false }))
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Network error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl ' +
    'placeholder-gray-400 bg-white/70 focus:outline-none focus:ring-2 focus:ring-fashion-rose ' +
    'focus:border-transparent transition-all duration-200 text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-sunset rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" />
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-ocean rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '3s' }} />

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-gradient-sunset rounded-2xl flex items-center justify-center shadow-fashion mb-4">
            <User className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900">
            {isLogin ? 'Welcome back' : 'Join FashionFusion'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg('') }}
              className="font-semibold text-fashion-rose hover:text-pink-600 transition-colors">
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl shadow-fashion-lg rounded-2xl p-8 border border-white/50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                {successMsg}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="email" type="email" required value={formData.email}
                  onChange={handleInputChange} className={inputClass} placeholder="you@example.com" />
              </div>
            </div>

            {/* Username — register only */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input name="username" type="text" required value={formData.username}
                    onChange={handleInputChange} className={inputClass} placeholder="your_username" />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password} onChange={handleInputChange}
                  className={`${inputClass} pr-10`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Register-only fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="full_name" type="text" required value={formData.full_name}
                      onChange={handleInputChange} className={inputClass} placeholder="Jane Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="phone" type="tel" value={formData.phone}
                      onChange={handleInputChange} className={inputClass} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="location" type="text" value={formData.location}
                      onChange={handleInputChange} className={inputClass} placeholder="Mumbai, India" />
                  </div>
                </div>

                {/* Tailor Checkbox */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_tailor"
                      checked={formData.is_tailor}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-fashion-rose border-gray-300 rounded focus:ring-fashion-rose"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">I am a fashion professional</span>
                      <p className="text-xs text-gray-500">Tailor, designer, or custom clothing specialist</p>
                    </div>
                    <Briefcase className="h-5 w-5 text-fashion-rose" />
                  </label>
                </div>

                {/* Business Profile - Only show if is_tailor is checked */}
                {formData.is_tailor && (
                  <div className="space-y-4 border-t border-gray-200 pt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Business Profile
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name *</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input name="business_name" type="text" required value={formData.business_name}
                          onChange={handleInputChange} className={inputClass} placeholder="Fashion Studio" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type *</label>
                      <select
                        name="business_type"
                        value={formData.business_type}
                        onChange={handleSelectChange}
                        className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 bg-white/70 focus:outline-none focus:ring-2 focus:ring-fashion-rose focus:border-transparent transition-all duration-200 text-sm"
                      >
                        <option value="tailor">Tailor</option>
                        <option value="designer">Fashion Designer</option>
                        <option value="both">Both Tailor & Designer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialties *</label>
                      <input name="specialties" type="text" required value={formData.specialties}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="e.g., Wedding wear, Casual wear, Alterations (comma-separated)" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience *</label>
                      <input name="experience_years" type="number" required min="0" max="50" value={formData.experience_years}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="5" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input name="business_address" type="text" required value={formData.business_address}
                          onChange={handleInputChange} className={inputClass} placeholder="123 Fashion Street, Mumbai" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input name="business_phone" type="tel" required value={formData.business_phone}
                          onChange={handleInputChange} className={inputClass} placeholder="+91 98765 43210" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-gradient-sunset text-white font-semibold rounded-xl shadow-fashion hover:shadow-fashion-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2"><div className="loading-spinner !w-5 !h-5 !border-2" /> {isLogin ? 'Signing in…' : 'Creating account…'}</span>
                : isLogin ? 'Sign in' : 'Create account'}
            </button>

            {isLogin && (
              <p className="text-center text-sm text-gray-400 mt-1">
                <a href="#" className="hover:text-fashion-rose transition-colors">Forgot password?</a>
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">By continuing you agree to our Terms &amp; Privacy Policy</p>
      </div>
    </div>
  )
}

export default Auth