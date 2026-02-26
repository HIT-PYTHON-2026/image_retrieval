import axios from 'axios'

// Base URL — dùng relative path vì Vite proxy đã xử lý /api và /v1
const BASE = ''

// Axios instance chính (với auth token)
const api = axios.create({ baseURL: BASE })

// Axios interceptor: tự động đính kèm JWT token vào mọi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ── Auth ─────────────────────────────────────────────────────────────────────
// POST /api/v1/login → { user_infor: { user_id, full_name, role, gender }, access_token }
export const loginAPI = (email, password) =>
    api.post('/api/v1/login', { email, password })

// POST /api/v1/register → { message }
export const registerAPI = (data) =>
    api.post('/api/v1/register', data)

// ── Search ───────────────────────────────────────────────────────────────────
// POST /api/v1/search — FormData: file (UploadFile), user_id
// LƯU Ý: KHÔNG set Content-Type thủ công — để Axios tự thêm boundary cho multipart
// Backend nhận field tên là 'file' (không phải 'image')
export const searchAPI = (file, userId) => {
    const formData = new FormData()
    formData.append('file', file)          // ← backend: file: UploadFile = File(...)
    formData.append('user_id', userId ? String(userId) : 'guest') // Fallback to 'guest' for non-logged-in users so backend can log history and avoid 400 error
    return api.post('/api/v1/search', formData)
}

// ── User Activity ─────────────────────────────────────────────────────────────
// GET /v1/history/search/{user_id}
export const getSearchHistoryAPI = (userId) =>
    api.get(`/v1/history/search/${userId}`)

// GET /v1/history/orders/{user_id}
export const getOrderHistoryAPI = (userId) =>
    api.get(`/v1/history/orders/${userId}`)

// POST /v1/rating → { user_id, product_id, rating }
export const rateProductAPI = (userId, productId, rating) =>
    api.post('/v1/rating', { user_id: userId, product_id: productId, rating })

// ── Brand ─────────────────────────────────────────────────────────────────────
// GET /api/v1/brand/products?brand_id={id}
export const getBrandProductsAPI = (brandId) =>
    api.get('/api/v1/brand/products', { params: { brand_id: brandId } })

// PUT /api/v1/brand/products/{product_id}/status → { is_active: bool }
export const toggleProductStatusAPI = (productId, isActive) =>
    api.put(`/api/v1/brand/products/${productId}/status`, { is_active: isActive })

// POST /api/v1/brand/products/add_product — FormData với tất cả fields + ảnh
// LƯU Ý: KHÔNG set Content-Type thủ công — để Axios tự thêm boundary cho multipart
export const addProductAPI = (formData) =>
    api.post('/api/v1/brand/products/add_product', formData)

// ── Products ────────────────────────────────────────────────────────────────
// GET /api/v1/top-rated?limit=10
export const getTopRatedAPI = (limit = 10) =>
    api.get('/api/v1/top-rated', { params: { limit } })

// ── Cart ─────────────────────────────────────────────────────────────────────
// POST /v1/cart — { user_id, product_id }
export const addToCartAPI = (userId, productId) =>
    api.post('/v1/cart', { user_id: String(userId), product_id: productId })

// GET /v1/cart/{user_id}
export const getCartAPI = (userId) =>
    api.get(`/v1/cart/${userId}`)

// DELETE /v1/cart/{user_id}/{product_id}
export const removeFromCartAPI = (userId, productId) =>
    api.delete(`/v1/cart/${userId}/${productId}`)

// POST /v1/cart/checkout — { user_id }
export const checkoutCartAPI = (userId) =>
    api.post('/v1/cart/checkout', { user_id: String(userId) })
