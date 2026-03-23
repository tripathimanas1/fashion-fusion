import React, { useState, useEffect, useRef } from 'react'
import { X, Package, Ruler, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface QuotationFormProps {
  design: any
  imageUrl: string
  onClose: () => void
}

export default function QuotationForm({ design, imageUrl, onClose }: QuotationFormProps) {
  const { user } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [form, setForm] = useState({
    standard_size: '',
    chest: '',
    waist: '',
    hips: '',
    height: '',
    shoulder_width: '',
    sleeve_length: '',
    inseam: '',
    preferred_material: '',
    additional_notes: '',
    shipping_address: '',
    shipping_city: '',
    shipping_country: 'India',
    shipping_postal_code: '',
    phone_number: '',
  })

  const suggestedMaterial = design.fabric_recommendations?.slice(0, 2).join(', ') || ''

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to place orders')
      return
    }
    if (!form.phone_number) {
      toast.error('Phone number is required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/quotations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          design_id: design.id,
          selected_image_url: imageUrl,
          suggested_material: suggestedMaterial,
          ...form,
          chest: form.chest ? parseFloat(form.chest) : null,
          waist: form.waist ? parseFloat(form.waist) : null,
          hips: form.hips ? parseFloat(form.hips) : null,
          height: form.height ? parseFloat(form.height) : null,
          shoulder_width: form.shoulder_width ? parseFloat(form.shoulder_width) : null,
          sleeve_length: form.sleeve_length ? parseFloat(form.sleeve_length) : null,
          inseam: form.inseam ? parseFloat(form.inseam) : null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Request sent to ${data.broadcast_to} tailors! Check Track Orders for quotes.`)
        onClose()
      } else {
        toast.error(data.detail || 'Failed to send request')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fashion-rose focus:border-transparent"
  const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-fashion-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-fashion-rose" /> Request Quotation
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected image preview */}
          <div className="flex gap-4 bg-rose-50 rounded-xl p-4">
            <img src={imageUrl} alt="Selected design"
              className="w-20 h-20 object-cover rounded-lg shadow-fashion flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{design.title || `Design #${design.id}`}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{design.prompt}</p>
              {suggestedMaterial && (
                <p className="text-xs text-fashion-rose mt-1.5 font-medium">
                  Suggested: {suggestedMaterial}
                </p>
              )}
            </div>
          </div>

          {/* Standard size */}
          <div>
            <label className={labelClass}>Standard Size</label>
            <div className="flex gap-2 flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                <button key={s} onClick={() => set('standard_size', form.standard_size === s ? '' : s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.standard_size === s
                      ? 'border-fashion-rose bg-rose-50 text-fashion-rose'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Body measurements */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-fashion-rose transition-colors"
            >
              <Ruler size={14} />
              Body Measurements (cm)
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['chest',         'Chest / Bust'],
                  ['waist',         'Waist'],
                  ['hips',          'Hips'],
                  ['height',        'Height'],
                  ['shoulder_width','Shoulder Width'],
                  ['sleeve_length', 'Sleeve Length'],
                  ['inseam',        'Inseam / Length'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type="number"
                      placeholder="cm"
                      value={form[key as keyof typeof form]}
                      onChange={e => set(key, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Material preference */}
          <div>
            <label className={labelClass}>Material Preference</label>
            <input type="text"
              placeholder={suggestedMaterial ? `Suggested: ${suggestedMaterial}` : 'e.g. Cotton, Silk, Linen'}
              value={form.preferred_material}
              onChange={e => set('preferred_material', e.target.value)}
              className={inputClass} />
            {suggestedMaterial && !form.preferred_material && (
              <button onClick={() => set('preferred_material', suggestedMaterial)}
                className="text-xs text-fashion-rose mt-1 hover:underline">
                Use suggested: {suggestedMaterial}
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              placeholder="Any special instructions, design modifications, colour preferences..."
              value={form.additional_notes}
              onChange={e => set('additional_notes', e.target.value)}
              className={`${inputClass} resize-none h-20`} />
          </div>

          {/* Shipping */}
          <div>
            <label className={labelClass}>Delivery Details</label>
            <div className="space-y-2">
              <input type="text" placeholder="Street address"
                value={form.shipping_address} onChange={e => set('shipping_address', e.target.value)}
                className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="City"
                  value={form.shipping_city} onChange={e => set('shipping_city', e.target.value)}
                  className={inputClass} />
                <input type="text" placeholder="Postal code"
                  value={form.shipping_postal_code} onChange={e => set('shipping_postal_code', e.target.value)}
                  className={inputClass} />
              </div>
              <input type="tel" placeholder="Phone number *"
                value={form.phone_number} onChange={e => set('phone_number', e.target.value)}
                className={inputClass} />
            </div>
          </div>

          {/* Submit */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-1">What happens next?</p>
            <p>Your request will be sent to all active tailors. Each tailor will review your design and measurements, then submit their price quote. You can compare quotes and choose the best one in <strong>Track Orders</strong>.</p>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-gradient-sunset text-white py-3.5 rounded-xl font-bold shadow-fashion hover:shadow-fashion-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting
              ? <><div className="loading-spinner !w-5 !h-5 !border-2" /> Sending to tailors…</>
              : <><Package size={18} /> Send Quotation Request</>}
          </button>
        </div>
      </div>
    </div>
  )
}
