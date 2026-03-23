import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Edit2, Save, X, LogOut, Palette, ShoppingBag, Heart } from 'lucide-react'
import { authApi, designsApi, ordersApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function UserProfile() {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [stats, setStats]         = useState({ designs: 0, saved: 0, orders: 0 })

  const [editForm, setEditForm] = useState({
    full_name:   user?.full_name  ?? '',
    phone:       user?.phone      ?? '',
    location:    user?.location   ?? '',
    is_designer: user?.is_designer ?? false,
    is_tailor:   user?.is_tailor   ?? false,
  })

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      setEditForm({
        full_name:   user.full_name  ?? '',
        phone:       user.phone      ?? '',
        location:    user.location   ?? '',
        is_designer: user.is_designer,
        is_tailor:   user.is_tailor,
      })
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    if (!user) return
    try {
      const [designs, saved, orders] = await Promise.allSettled([
        designsApi.getByUser(user.id),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/designs/saved/${user.id}/count`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        ).then(r => r.json()),
        ordersApi.getByUser(user.id),
      ])
      setStats({
        designs: designs.status === 'fulfilled' ? designs.value.length : 0,
        saved:   saved.status   === 'fulfilled' ? (saved.value.count ?? 0) : 0,
        orders:  orders.status  === 'fulfilled' ? orders.value.length  : 0,
      })
    } catch { /* silently ignore */ }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await authApi.updateMe(editForm)
      toast.success('Profile updated!')
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-sunset rounded-2xl flex items-center justify-center shadow-fashion">
              <span className="text-white text-2xl font-bold font-display">
                {user.full_name?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.full_name || user.username}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          {!isEditing ? (
            <button onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-sunset text-white rounded-xl text-sm font-semibold shadow-fashion hover:shadow-fashion-lg transition-all">
              <Edit2 size={14} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleUpdate} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-mint text-white rounded-xl text-sm font-semibold shadow-mint disabled:opacity-50 transition-all">
                <Save size={14} /> {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email — always read-only */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <div className="flex items-center gap-2 text-gray-900 text-sm">
              <Mail size={14} className="text-gray-400" /> {user.email}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
            {isEditing ? (
              <input name="full_name" value={editForm.full_name} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fashion-rose focus:border-transparent" />
            ) : (
              <div className="flex items-center gap-2 text-gray-900 text-sm">
                <User size={14} className="text-gray-400" /> {user.full_name || '—'}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
            {isEditing ? (
              <input name="phone" type="tel" value={editForm.phone} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fashion-rose focus:border-transparent" />
            ) : (
              <div className="flex items-center gap-2 text-gray-900 text-sm">
                <Phone size={14} className="text-gray-400" /> {user.phone || 'Not provided'}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
            {isEditing ? (
              <input name="location" value={editForm.location} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fashion-rose focus:border-transparent" />
            ) : (
              <div className="flex items-center gap-2 text-gray-900 text-sm">
                <MapPin size={14} className="text-gray-400" /> {user.location || 'Not provided'}
              </div>
            )}
          </div>

          {/* Roles — edit only */}
          {isEditing && (
            <>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_designer" checked={editForm.is_designer} onChange={handleInputChange}
                  className="rounded border-gray-300 text-fashion-rose focus:ring-fashion-rose" />
                <span className="text-sm text-gray-700 font-medium">I'm a Designer</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_tailor" checked={editForm.is_tailor} onChange={handleInputChange}
                  className="rounded border-gray-300 text-fashion-rose focus:ring-fashion-rose" />
                <span className="text-sm text-gray-700 font-medium">I'm a Tailor</span>
              </label>
            </>
          )}
        </div>

        {/* Role badges */}
        {!isEditing && (user.is_designer || user.is_tailor) && (
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
            {user.is_designer && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium">
                <Palette size={14} /> Designer
              </span>
            )}
            {user.is_tailor && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium">
                <ShoppingBag size={14} /> Tailor
              </span>
            )}
          </div>
        )}

        {/* Logout */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
          <button onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: Palette,      label: 'Designs Created',  value: stats.designs, color: 'from-rose-100 to-pink-100',   icon_color: 'text-rose-600' },
          { icon: Heart,        label: 'Saved Designs',    value: stats.saved,   color: 'from-purple-100 to-pink-100', icon_color: 'text-purple-600' },
          { icon: ShoppingBag,  label: 'Orders',           value: stats.orders,  color: 'from-blue-100 to-cyan-100',   icon_color: 'text-blue-600' },
        ].map(({ icon: Icon, label, value, color, icon_color }) => (
          <div key={label} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-fashion p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-gradient-to-r ${color} rounded-xl`}>
                <Icon className={`w-5 h-5 ${icon_color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}