import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, XCircle, Star, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Quote {
  quote_id:       number
  tailor_id:      number
  tailor_name:    string
  tailor_rating:  number
  price:          number
  estimated_days: number | null
  notes:          string | null
  status:         string
  created_at:     string
}

interface QuotationReq {
  request_id:          number
  status:              string
  design_id:           number
  design_title:        string
  selected_image_url:  string
  suggested_material:  string | null
  preferred_material:  string | null
  standard_size:       string | null
  additional_notes:    string | null
  created_at:          string
  expires_at:          string | null
  quotes:              Quote[]
  quote_count:         number
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Waiting for quotes', color: 'text-yellow-600 bg-yellow-50',  icon: Clock },
  quoted:    { label: 'Quotes received',    color: 'text-blue-600 bg-blue-50',      icon: Package },
  accepted:  { label: 'Order confirmed',    color: 'text-green-600 bg-green-50',    icon: CheckCircle },
  cancelled: { label: 'Cancelled',          color: 'text-gray-500 bg-gray-100',     icon: XCircle },
  expired:   { label: 'Expired',            color: 'text-red-500 bg-red-50',        icon: XCircle },
}

export default function TrackOrders() {
  const { user } = useAuth()
  const [requests, setRequests]     = useState<QuotationReq[]>([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<Set<number>>(new Set())
  const [accepting, setAccepting]   = useState<number | null>(null)

  useEffect(() => {
    if (user?.id) fetchRequests()
  }, [user?.id])

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/quotations/user/${user!.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(Array.isArray(data) ? data : [])
      }
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const acceptQuote = async (requestId: number, quoteId: number) => {
    setAccepting(quoteId)
    try {
      const res = await fetch(`${API_URL}/api/v1/quotations/${requestId}/accept/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ user_id: user!.id }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Order ${data.order_number} confirmed with ${data.tailor}!`)
        fetchRequests()
      } else {
        toast.error(data.detail || 'Failed to accept quote')
      }
    } catch { toast.error('Network error') }
    finally { setAccepting(null) }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="loading-spinner" />
    </div>
  )

  if (requests.length === 0) return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/80 rounded-2xl shadow-fashion p-12 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gradient-sunset rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-fashion">
          <ShoppingBag className="text-white" size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">No orders yet</h3>
        <p className="text-gray-500 text-sm">
          Go to Marketplace, find a design you like, and click <strong>Buy</strong> to send a quotation to tailors.
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Track Orders</h2>

      {requests.map(req => {
        const cfg = statusConfig[req.status] || statusConfig.pending
        const Icon = cfg.icon
        const isExpanded = expanded.has(req.request_id)
        const isAccepted = req.status === 'accepted'

        return (
          <div key={req.request_id} className="bg-white rounded-2xl shadow-fashion border border-gray-50 overflow-hidden">
            {/* Header row */}
            <div className="p-5 flex items-start gap-4">
              {/* Design image */}
              <img src={req.selected_image_url} alt={req.design_title}
                className="w-16 h-16 object-cover rounded-xl shadow-fashion flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 truncate">{req.design_title || `Design #${req.design_id}`}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      {req.standard_size && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Size: {req.standard_size}
                        </span>
                      )}
                      {req.preferred_material && (
                        <span className="text-xs bg-rose-50 text-fashion-rose px-2 py-1 rounded-full">
                          {req.preferred_material}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Quote count */}
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {req.quote_count === 0
                      ? 'Waiting for tailor quotes…'
                      : `${req.quote_count} quote${req.quote_count > 1 ? 's' : ''} received`}
                  </span>
                  {req.quote_count > 0 && !isAccepted && (
                    <button onClick={() => toggleExpand(req.request_id)}
                      className="text-fashion-rose text-sm font-semibold flex items-center gap-1 hover:underline">
                      {isExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Compare quotes</>}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quotes panel */}
            {isExpanded && req.quotes.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 mb-3">
                  Quotes from tailors — select one to confirm your order
                </h4>
                {req.quotes
                  .sort((a, b) => a.price - b.price)
                  .map(q => (
                    <div key={q.quote_id}
                      className={`bg-white rounded-xl p-4 border-2 transition-all ${
                        q.status === 'accepted'
                          ? 'border-green-400 bg-green-50/30'
                          : 'border-gray-100 hover:border-fashion-rose/30'
                      }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{q.tailor_name}</span>
                            <div className="flex items-center gap-0.5 text-xs text-yellow-500">
                              <Star size={11} className="fill-yellow-500" />
                              <span className="text-gray-600">{q.tailor_rating.toFixed(1)}</span>
                            </div>
                            {q.status === 'accepted' && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-fashion-rose">₹{q.price.toLocaleString()}</p>
                          {q.estimated_days && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Delivery in ~{q.estimated_days} days
                            </p>
                          )}
                          {q.notes && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5 italic">
                              "{q.notes}"
                            </p>
                          )}
                        </div>

                        {!isAccepted && q.status !== 'accepted' && (
                          <button
                            onClick={() => acceptQuote(req.request_id, q.quote_id)}
                            disabled={accepting === q.quote_id}
                            className="bg-gradient-sunset text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-fashion hover:shadow-fashion-lg transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0 ml-4">
                            {accepting === q.quote_id
                              ? <div className="loading-spinner !w-4 !h-4 !border-2" />
                              : <CheckCircle size={16} />}
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Accepted state */}
            {isAccepted && (
              <div className="border-t border-green-100 bg-green-50/50 px-5 py-3">
                <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                  <CheckCircle size={15} /> Order confirmed — your tailor will be in touch shortly.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}