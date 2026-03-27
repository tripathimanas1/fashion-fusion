import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  X,
  MessageSquare,
  Package,
  Settings,
  Star,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { quotationsApi, tailorApi } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Order {
  id: number
  order_number: string
  title: string
  description: string
  status: string
  design_image_url?: string
  quote_price?: number
  quote_description?: string
  quote_timeline?: string
  quote_expires_at?: string
  requested_deadline?: string
  completion_percentage: number
  current_stage: string
  created_at: string
  user_name: string
  user_email: string
  user_phone?: string
  shipping_address?: string
  shipping_city?: string
  shipping_country?: string
  shipping_postal_code?: string
  phone_number?: string
  measurements?: Record<string, string | number | null>
  special_requirements?: string
  color_palette?: Array<{ hex?: string; percentage?: number }>
  fabric_recommendations?: string[]
  order_items?: Array<{
    id: number
    design_id: number
    quantity: number
    size?: string
    color?: string
    fabric_type?: string
    price: number
    customizations?: {
      selected_image_url?: string
      preferred_material?: string
      suggested_material?: string
      additional_notes?: string
      color_palette?: Array<{ hex?: string; percentage?: number }>
    }
  }>
}

interface TailorProfile {
  id: number
  user_id: number
  business_name: string
  business_type: string
  business_address: string
  business_phone: string
  business_email: string
  specialties: string[]
  experience_years: number
  description?: string
  rating: number
  total_reviews: number
  total_orders: number
  completed_orders: number
  is_verified: boolean
  is_available: boolean
  location?: string
  service_radius_km: number
  active_orders_count: number
  pending_quotes_count: number
  completion_rate: number
}

interface Analytics {
  total_orders: number
  completed_orders: number
  active_orders: number
  pending_quotes: number
  total_revenue: number
  monthly_revenue: number
  average_order_value: number
  completion_rate: number
  rating: number
  status_breakdown: Record<string, number>
}

interface PendingQuotation {
  request_id: number
  design_id: number
  design_title: string
  design_description?: string
  design_prompt?: string
  design_image_urls: string[]
  color_palette: Array<{ hex?: string; percentage?: number }>
  fabric_recommendations: string[]
  style_recommendations: Array<{ style?: string; similarity?: number }>
  selected_image_url: string
  standard_size?: string
  chest?: number
  waist?: number
  hips?: number
  height?: number
  shoulder_width?: number
  sleeve_length?: number
  inseam?: number
  suggested_material?: string
  preferred_material?: string
  additional_notes?: string
  created_at: string
  expires_at?: string
}

export default function TailorDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'messages' | 'profile' | 'analytics'>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingQuotation[]>([])
  const [profile, setProfile] = useState<TailorProfile | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')
  const [submittingQuoteId, setSubmittingQuoteId] = useState<number | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PendingQuotation | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!user?.is_tailor) {
      router.push('/')
      return
    }
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [profileData, analyticsData] = await Promise.all([
        tailorApi.getProfile(),
        tailorApi.getAnalytics(),
      ])

      setProfile(profileData)
      setAnalytics(analyticsData)

      await Promise.all([
        loadOrders(orderStatusFilter),
        loadPendingRequests(),
      ])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async (status: string = 'all') => {
    try {
      const ordersData = status === 'all'
        ? await tailorApi.getOrders()
        : await tailorApi.getOrders({ status })
      setOrders(ordersData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders')
    }
  }

  const loadPendingRequests = async () => {
    if (!user) return
    try {
      const requests = await quotationsApi.getTailorPending(user.id)
      setPendingRequests(requests)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load quotation requests')
    }
  }

  const handleStatusFilter = (status: string) => {
    setOrderStatusFilter(status)
    loadOrders(status)
  }

  const handleSubmitQuote = async (requestId: number) => {
    if (!user) return

    const priceText = window.prompt('Enter your quote amount')
    if (!priceText) return

    const price = Number(priceText)
    if (Number.isNaN(price) || price <= 0) {
      toast.error('Please enter a valid quote amount')
      return
    }

    const daysText = window.prompt('Estimated delivery time in days', '7')
    const estimatedDays = daysText ? Number(daysText) : undefined
    if (daysText && (Number.isNaN(estimatedDays) || estimatedDays <= 0)) {
      toast.error('Please enter a valid delivery estimate')
      return
    }

    const notes = window.prompt('Optional note for the customer', '') || undefined

    try {
      setSubmittingQuoteId(requestId)
      await quotationsApi.submitQuote(requestId, {
        tailor_user_id: user.id,
        price,
        estimated_days: estimatedDays,
        notes,
      })
      toast.success('Quote submitted successfully')
      await loadDashboardData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit quote')
    } finally {
      setSubmittingQuoteId(null)
    }
  }

  const handleViewOrderDetails = async (order: Order) => {
    try {
      const orderDetails = await tailorApi.getOrder(order.id)
      setSelectedOrder(orderDetails)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load order details')
      setSelectedOrder(order)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_quote: 'bg-yellow-100 text-yellow-800',
      quote_ready: 'bg-blue-100 text-blue-800',
      quote_rejected: 'bg-red-100 text-red-800',
      order_active: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      pending_quote: <Clock className="w-4 h-4" />,
      quote_ready: <DollarSign className="w-4 h-4" />,
      quote_rejected: <AlertCircle className="w-4 h-4" />,
      order_active: <CheckCircle className="w-4 h-4" />,
      in_progress: <Package className="w-4 h-4" />,
      ready: <CheckCircle className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

  const detailImage = selectedRequest
    ? selectedRequest.selected_image_url || selectedRequest.design_image_urls?.[0]
    : ''

  const measurementRows = selectedRequest
    ? [
        ['Standard size', selectedRequest.standard_size],
        ['Chest', selectedRequest.chest ? `${selectedRequest.chest} cm` : ''],
        ['Waist', selectedRequest.waist ? `${selectedRequest.waist} cm` : ''],
        ['Hips', selectedRequest.hips ? `${selectedRequest.hips} cm` : ''],
        ['Height', selectedRequest.height ? `${selectedRequest.height} cm` : ''],
        ['Shoulder width', selectedRequest.shoulder_width ? `${selectedRequest.shoulder_width} cm` : ''],
        ['Sleeve length', selectedRequest.sleeve_length ? `${selectedRequest.sleeve_length} cm` : ''],
        ['Inseam', selectedRequest.inseam ? `${selectedRequest.inseam} cm` : ''],
      ].filter(([, value]) => Boolean(value))
    : []

  const selectedOrderItem = selectedOrder?.order_items?.[0]
  const selectedOrderMeasurementRows = selectedOrder
    ? [
        ['Standard size', selectedOrderItem?.size || selectedOrder.measurements?.standard_size],
        ['Chest', selectedOrder.measurements?.chest ? `${selectedOrder.measurements.chest} cm` : ''],
        ['Waist', selectedOrder.measurements?.waist ? `${selectedOrder.measurements.waist} cm` : ''],
        ['Hips', selectedOrder.measurements?.hips ? `${selectedOrder.measurements.hips} cm` : ''],
        ['Height', selectedOrder.measurements?.height ? `${selectedOrder.measurements.height} cm` : ''],
        ['Shoulder width', selectedOrder.measurements?.shoulder_width ? `${selectedOrder.measurements.shoulder_width} cm` : ''],
        ['Sleeve length', selectedOrder.measurements?.sleeve_length ? `${selectedOrder.measurements.sleeve_length} cm` : ''],
        ['Inseam', selectedOrder.measurements?.inseam ? `${selectedOrder.measurements.inseam} cm` : ''],
      ].filter(([, value]) => Boolean(value))
    : []

  const selectedOrderColors = selectedOrderItem?.color
    ? selectedOrderItem.color.split(',').map((value) => value.trim()).filter(Boolean)
    : (selectedOrder?.color_palette || []).map((color) => color.hex).filter(Boolean) as string[]

  const selectedOrderMaterial =
    selectedOrderItem?.fabric_type ||
    selectedOrderItem?.customizations?.preferred_material ||
    selectedOrderItem?.customizations?.suggested_material

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading Tailor Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-sunset rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tailor Portal</h1>
                <p className="text-sm text-gray-500">{profile?.business_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={logout} className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'profile', label: 'Profile', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2 inline" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && profile && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.active_orders_count}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${analytics.monthly_revenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.rating.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pending Quotation Requests</h3>
              </div>
              <div className="p-6">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">No pending quotation requests yet.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.design_title || `Design #${request.design_id}`}</p>
                            <p className="text-sm text-gray-500">
                              {request.preferred_material || request.suggested_material || 'Material flexible'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleSubmitQuote(request.request_id)}
                            disabled={submittingQuoteId === request.request_id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {submittingQuoteId === request.request_id ? 'Submitting...' : 'Send Quote'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Confirmed Orders</h3>
              </div>
              <div className="p-6">
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-500">No confirmed orders yet. Customer requests show up above first.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.title}</p>
                            <p className="text-sm text-gray-500">{order.user_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatStatus(order.status)}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pending Quotation Requests</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingRequests.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No pending quotation requests right now.</div>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request.request_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start space-x-4">
                          {request.selected_image_url && (
                            <img
                              src={request.selected_image_url}
                              alt={request.design_title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">{request.design_title || `Design #${request.design_id}`}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Awaiting Quote
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Preferred material: {request.preferred_material || request.suggested_material || 'Not specified'}
                            </p>
                            {request.additional_notes && (
                              <p className="text-sm text-gray-500 mt-2">{request.additional_notes}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
                              {request.standard_size && (
                                <>
                                  <span>•</span>
                                  <span>Size {request.standard_size}</span>
                                </>
                              )}
                              {request.expires_at && (
                                <>
                                  <span>•</span>
                                  <span>Expires {new Date(request.expires_at).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleSubmitQuote(request.request_id)}
                            disabled={submittingQuoteId === request.request_id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {submittingQuoteId === request.request_id ? 'Submitting...' : 'Submit Quote'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Confirmed Orders</h3>
                  <div className="flex space-x-2">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'pending_quote', label: 'Pending Quote' },
                      { id: 'quote_ready', label: 'Quote Ready' },
                      { id: 'order_active', label: 'Active' },
                      { id: 'in_progress', label: 'In Progress' },
                      { id: 'delivered', label: 'Completed' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => handleStatusFilter(filter.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          orderStatusFilter === filter.id
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No confirmed orders yet.</div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {order.design_image_url && (
                            <img
                              src={order.design_image_url}
                              alt={order.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">{order.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {formatStatus(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Customer: {order.user_name}</span>
                              <span>•</span>
                              <span>{new Date(order.created_at).toLocaleDateString()}</span>
                              {order.quote_price && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-gray-900">Quote: ${order.quote_price.toFixed(2)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
            <p className="text-gray-500">Order messaging system coming soon...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
            <p className="text-gray-500">Detailed analytics dashboard coming soon...</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
            <p className="text-gray-500">Profile management coming soon...</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedRequest.design_title || `Design #${selectedRequest.design_id}`}
                </h2>
                <p className="text-sm text-gray-500">
                  Requested on {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-8">
              <div className="space-y-5">
                {detailImage && (
                  <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <img
                      src={detailImage}
                      alt={selectedRequest.design_title}
                      className="w-full max-h-[560px] object-contain"
                    />
                  </div>
                )}

                {selectedRequest.design_image_urls?.length > 1 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Generated Variations</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedRequest.design_image_urls.map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          onClick={() => setSelectedRequest({ ...selectedRequest, selected_image_url: url })}
                          className={`rounded-xl overflow-hidden border-2 transition-colors ${
                            selectedRequest.selected_image_url === url ? 'border-purple-500' : 'border-gray-200'
                          }`}
                        >
                          <img src={url} alt={`Variation ${index + 1}`} className="w-full h-28 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedRequest.design_prompt || selectedRequest.design_description || selectedRequest.additional_notes) && (
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-4">
                    {selectedRequest.design_prompt && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Design Prompt</h3>
                        <p className="text-sm text-gray-600 leading-6">{selectedRequest.design_prompt}</p>
                      </div>
                    )}
                    {selectedRequest.design_description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                        <p className="text-sm text-gray-600 leading-6">{selectedRequest.design_description}</p>
                      </div>
                    )}
                    {selectedRequest.additional_notes && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Customer Notes</h3>
                        <p className="text-sm text-gray-600 leading-6">{selectedRequest.additional_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Materials and Styling</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Preferred Material</p>
                      <p className="text-sm text-gray-800">{selectedRequest.preferred_material || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Suggested Material</p>
                      <p className="text-sm text-gray-800">
                        {selectedRequest.suggested_material || selectedRequest.fabric_recommendations?.join(', ') || 'Not specified'}
                      </p>
                    </div>
                    {selectedRequest.fabric_recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fabric Recommendations</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.fabric_recommendations.map((fabric) => (
                            <span key={fabric} className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                              {fabric}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRequest.style_recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Style Signals</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.style_recommendations.slice(0, 4).map((item, index) => (
                            <span key={`${item.style}-${index}`} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                              {item.style || 'Style'}
                              {typeof item.similarity === 'number' ? ` ${(item.similarity * 100).toFixed(0)}%` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRequest.color_palette?.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Color Palette</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRequest.color_palette.map((color, index) => (
                        <div key={`${color.hex}-${index}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
                          <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: color.hex || '#e5e7eb' }} />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{color.hex || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">
                              {typeof color.percentage === 'number' ? `${color.percentage}% prominence` : 'Detected tone'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Sizing and Measurements</h3>
                  {measurementRows.length === 0 ? (
                    <p className="text-sm text-gray-500">No measurement details were provided.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {measurementRows.map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="text-sm text-gray-800 mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Next Step</h3>
                  <p className="text-sm text-gray-600 leading-6 mb-4">
                    Review the design, materials, colors, and measurements here first. Once you’re ready, submit a quote with your price and delivery estimate.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleSubmitQuote(selectedRequest.request_id)}
                      disabled={submittingQuoteId === selectedRequest.request_id}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {submittingQuoteId === selectedRequest.request_id ? 'Submitting...' : 'Quote This Request'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOrder.title}</h2>
                <p className="text-sm text-gray-500">
                  {selectedOrder.order_number} • {formatStatus(selectedOrder.status)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedOrder.design_image_url && (
                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <img
                    src={selectedOrder.design_image_url}
                    alt={selectedOrder.title}
                    className="w-full max-h-[420px] object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Summary</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Customer:</span> {selectedOrder.user_name}</p>
                    <p><span className="font-semibold text-gray-900">Email:</span> {selectedOrder.user_email}</p>
                    <p><span className="font-semibold text-gray-900">Phone:</span> {selectedOrder.user_phone || 'Not provided'}</p>
                    <p><span className="font-semibold text-gray-900">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    <p><span className="font-semibold text-gray-900">Stage:</span> {selectedOrder.current_stage || 'Not set'}</p>
                    <p><span className="font-semibold text-gray-900">Progress:</span> {selectedOrder.completion_percentage}%</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quote & Delivery</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Quote Price:</span> {typeof selectedOrder.quote_price === 'number' ? `$${selectedOrder.quote_price.toFixed(2)}` : 'Not set'}</p>
                    <p><span className="font-semibold text-gray-900">Timeline:</span> {selectedOrder.quote_timeline || 'Not set'}</p>
                    <p><span className="font-semibold text-gray-900">Deadline:</span> {selectedOrder.requested_deadline ? new Date(selectedOrder.requested_deadline).toLocaleDateString() : 'Not set'}</p>
                    <p><span className="font-semibold text-gray-900">Shipping City:</span> {selectedOrder.shipping_city || 'Not provided'}</p>
                    <p><span className="font-semibold text-gray-900">Shipping Country:</span> {selectedOrder.shipping_country || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h3>
                <p className="text-sm text-gray-700 leading-6">
                  {selectedOrder.description || 'No order description available.'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 space-y-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Design Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p><span className="font-semibold text-gray-900">Size:</span> {selectedOrderItem?.size || selectedOrder.measurements?.standard_size || 'Not provided'}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold text-gray-900">Material:</span> {selectedOrderMaterial || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Colors</h4>
                  {selectedOrderColors.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {selectedOrderColors.map((color, index) => (
                        <div key={`${color}-${index}`} className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                          <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color || '#e5e7eb' }} />
                          <span>{color}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No colors were provided.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Measurements</h4>
                  {selectedOrderMeasurementRows.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedOrderMeasurementRows.map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="text-sm text-gray-800 mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No measurement details were provided.</p>
                  )}
                </div>

                {(selectedOrder.special_requirements ||
                  selectedOrderItem?.customizations?.additional_notes ||
                  (selectedOrder.fabric_recommendations && selectedOrder.fabric_recommendations.length > 0)) && (
                  <div className="space-y-3">
                    {selectedOrder.special_requirements && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Customer Notes</h4>
                        <p className="text-sm text-gray-700 leading-6">{selectedOrder.special_requirements}</p>
                      </div>
                    )}

                    {!selectedOrder.special_requirements && selectedOrderItem?.customizations?.additional_notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Customer Notes</h4>
                        <p className="text-sm text-gray-700 leading-6">{selectedOrderItem.customizations.additional_notes}</p>
                      </div>
                    )}

                    {selectedOrder.fabric_recommendations && selectedOrder.fabric_recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Fabric Suggestions</h4>
                        <p className="text-sm text-gray-700 leading-6">{selectedOrder.fabric_recommendations.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedOrder.quote_description && (
                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quote Notes</h3>
                  <p className="text-sm text-gray-700 leading-6">{selectedOrder.quote_description}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
