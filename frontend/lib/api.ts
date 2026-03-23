/**
 * Centralized API service
 * - Single source of truth for the base URL
 * - Automatically attaches the Bearer token from localStorage
 * - Throws a typed ApiError so callers can inspect status codes
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  // Build headers — start with JSON default, then apply caller overrides
  const headers: Record<string, string> = {}

  // Only set Content-Type to JSON if body is NOT FormData
  // (FormData needs the browser to set Content-Type with boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Merge any caller-provided headers
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>)
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  // Explicitly preserve method — never let it default to GET accidentally
  const method = options.method || 'GET'

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    method,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, err.detail || 'Request failed')
  }

  return res.json() as Promise<T>
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string
    username: string
    password: string
    full_name: string
    phone?: string
    location?: string
  }) =>
    request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<UserProfile>('/api/v1/auth/me'),

  updateMe: (data: Partial<UserProfile>) =>
    request('/api/v1/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// ── Designs ─────────────────────────────────────────────────────────────────

export const designsApi = {
  generate: (formData: FormData) =>
    request<GeneratedDesign>('/api/v1/designs/generate', {
      method: 'POST',
      body: formData,
    } as RequestInit),

  generateMultiStyle: (data: {
    prompt: string;
    styles: { style: string; weight: number }[];
    num_outputs: number;
    user_id: number;
    generation_type: string;
  }) =>
    request<GeneratedDesign>('/api/v1/designs/generate-multi-style', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recolorDesign: (data: {
    design_id: number;
    target_colors: string[];
    fabric_type?: string;
    preserve_highlights?: boolean;
    add_as_variation?: boolean;
  }) =>
    request<any>('/api/v1/designs/recolor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  swapFabric: (data: {
    design_id: number;
    target_fabric: string;
    preserve_pattern?: boolean;
    adjust_texture?: boolean;
    add_as_variation?: boolean;
  }) =>
    request<any>('/api/v1/designs/fabric-swap', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sketchToDesign: (formData: FormData) =>
    request<GeneratedDesign>('/api/v1/designs/sketch-to-design', {
      method: 'POST',
      body: formData,
    }),

  getByUser: (userId: number) =>
    request<Design[]>(`/api/v1/designs/user/${userId}`),

  getById: (id: number) =>
    request<Design>(`/api/v1/designs/${id}`),

  save: (designId: number, userId: number, boardId?: number) =>
    request('/api/v1/designs/save', {
      method: 'POST',
      body: JSON.stringify({ design_id: designId, user_id: userId, board_id: boardId }),
    }),

  getSaved: (userId: number) =>
    request<SavedDesignEntry[]>(`/api/v1/designs/saved/${userId}`),

  unsave: (savedDesignId: number, userId: number) =>
    request(`/api/v1/designs/saved/${savedDesignId}?user_id=${userId}`, { method: 'DELETE' }),

  getSavedCount: (userId: number) =>
    request<{ count: number }>(`/api/v1/designs/saved/${userId}/count`),

  getBoards: (userId: number) =>
    request<Board[]>(`/api/v1/designs/boards/${userId}`),

  createBoard: (userId: number, name: string, description?: string) =>
    request<Board>('/api/v1/designs/boards', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, name, description }),
    }),
}

// ── Recommendations ──────────────────────────────────────────────────────────

export const recommendationsApi = {
  trending: () =>
    request<{ trending_designs: Design[] }>('/api/v1/recommendations/trending'),
}

// ── Marketplace ──────────────────────────────────────────────────────────────

export const marketplaceApi = {
  getTailors: (lat: number, lng: number, radiusKm = 50) =>
    request<Tailor[]>(`/api/v1/marketplace/tailors?latitude=${lat}&longitude=${lng}&radius_km=${radiusKm}`),

  getMarketplaces: () =>
    request<MarketplaceItem[]>('/api/v1/marketplace/marketplaces'),

  getFeaturedDesigns: () =>
    request<FeaturedDesign[]>('/api/v1/marketplace/designs/featured'),

  contactTailor: (tailorId: number, userId: number, message: string) =>
    request(`/api/v1/marketplace/tailors/${tailorId}/contact`, {
      method: 'POST',
      body: JSON.stringify({ message, user_id: userId }),
    }),
}

// ── TryOn ───────────────────────────────────────────────────────────────────

export const tryonApi = {
  process: (formData: FormData) =>
    request<{ tryon_result_url: string }>('/api/v1/tryon/virtual-tryon', {
      method: 'POST',
      body: formData,
    }),
}

// ── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  getByUser: (userId: number) =>
    request<Order[]>(`/api/v1/orders/user/${userId}`),

  getById: (orderId: number) =>
    request<any>(`/api/v1/orders/${orderId}`),
}

// ── Shared types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number
  email: string
  username: string
  full_name: string
  phone?: string
  location?: string
  is_designer: boolean
  is_tailor: boolean
  created_at: string
}

export interface Design {
  id: number
  title?: string
  description?: string
  prompt: string
  image_urls: string[]
  color_palette: ColorSwatch[]
  style_recommendations: StyleRec[]
  fabric_recommendations: string[]
  likes_count: number
  created_at: string
  user?: { username: string; full_name: string }
}

export interface GeneratedDesign {
  design_id: number
  image_urls: string[]
  color_palette: ColorSwatch[]
  style_recommendations: StyleRec[]
  fabric_recommendations: string[]
}

export interface ColorSwatch {
  hex: string
  rgb: number[]
  percentage: number
}

export interface StyleRec {
  style: string
  similarity: number
}

export interface Board {
  id: number
  title: string
  description?: string
  user_id: number
  created_at: string
}

export interface Tailor {
  id: number
  name: string
  email: string
  phone?: string
  location: string
  specialization: string
  rating: number
  experience_years: number
  bio?: string
  is_available: boolean
  distance_km?: number
}

export interface MarketplaceItem {
  id: number
  name: string
  description: string
  image_url: string
  is_active: boolean
}

export interface FeaturedDesign {
  design_id: number
  image_url: string
  title: string
  designer_name: string
  price: string
  likes: number
  created_at: string
}

export interface SavedDesignEntry {
  saved_design_id: number
  saved_at: string
  board_id?: number
  design: Design
}

export interface Order {
  id: number
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

// ── Quotations ────────────────────────────────────────────────────────────────

export const quotationsApi = {
  create: (data: any) =>
    request('/api/v1/quotations/', { method: 'POST', body: JSON.stringify(data) }),

  getByUser: (userId: number) =>
    request<any[]>(`/api/v1/quotations/user/${userId}`),

  submitQuote: (requestId: number, data: any) =>
    request(`/api/v1/quotations/${requestId}/quote`, { method: 'POST', body: JSON.stringify(data) }),

  acceptQuote: (requestId: number, quoteId: number, userId: number) =>
    request(`/api/v1/quotations/${requestId}/accept/${quoteId}`, {
      method: 'POST', body: JSON.stringify({ user_id: userId })
    }),

  getTailorPending: (tailorUserId: number) =>
    request<any[]>(`/api/v1/quotations/tailor/${tailorUserId}/pending`),
}