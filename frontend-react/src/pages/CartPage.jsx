import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCartAPI, removeFromCartAPI, checkoutCartAPI } from '../services/api'
import ProductDetailModal from '../components/ProductDetailModal'
import { ShoppingCart, Trash2, PackageCheck, RefreshCw, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function CartPage() {
    const { user } = useAuth()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [removing, setRemoving] = useState(null)
    const [checkout, setCheckout] = useState(null)   // null | 'loading' | 'done' | 'error'
    const [checkoutMsg, setCheckoutMsg] = useState('')
    const [invalidItems, setInvalidItems] = useState([]) // tên SP bị discontinued
    const [detailProduct, setDetailProduct] = useState(null) // product đang xem chi tiết

    const fetchCart = useCallback(() => {
        setLoading(true)
        getCartAPI(user.user_id)
            .then(r => setItems(r.data?.data || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false))
    }, [user.user_id])

    useEffect(() => { fetchCart() }, [fetchCart])

    const handleRemove = async (productId) => {
        setRemoving(productId)
        try {
            await removeFromCartAPI(user.user_id, productId)
            setItems(prev => prev.filter(i => i.product_id !== productId))
            toast.success('Item removed')
        } catch {
            toast.error('Failed to remove item')
        }
        setRemoving(null)
    }

    const handleCheckout = async () => {
        if (!items.length) return
        setCheckout('loading')
        setInvalidItems([])
        try {
            const res = await checkoutCartAPI(user.user_id)
            setCheckoutMsg(res.data?.message || 'Order placed successfully!')
            setItems([])
            setCheckout('done')
            toast.success('Order placed successfully')
        } catch (err) {
            const detail = err.response?.data?.detail
            if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
                setCheckoutMsg(detail.message || 'Một số sản phẩm không còn khả dụng')
                setInvalidItems(detail.invalid_items || [])
            } else if (typeof detail === 'string') {
                setCheckoutMsg(detail)
                toast.error(detail)
            } else {
                const msg = 'Checkout failed. Please try again.'
                setCheckoutMsg(msg)
                toast.error(msg)
            }
            setCheckout('error')
        }
    }

    const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price || 0), 0)
    const itemCount = items.length

    return (
        <div className="min-h-screen bg-[#fafafa] pt-28 pb-20 px-6 lg:px-12">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-12 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl flex items-center gap-4 text-gray-900 italic">
                            Shopping Cart
                        </h1>
                        <p className="text-gray-500 font-light mt-2">{itemCount} items in your bag</p>
                    </div>
                    <button onClick={fetchCart} className="text-gray-500 hover:text-black transition-colors flex items-center gap-1.5 text-sm font-light">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {/* Checkout success */}
                {checkout === 'done' ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
                        <PackageCheck size={56} strokeWidth={1} className="mx-auto text-green-600 mb-6" />
                        <h2 className="font-display text-3xl mb-4 text-gray-900">Order Confirmed</h2>
                        <p className="text-gray-500 font-light mb-10">{checkoutMsg}</p>
                        <button onClick={() => setCheckout(null)} className="bg-black text-white px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors">
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-32">
                                <div className="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-32 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <ShoppingCart size={48} strokeWidth={1} className="mx-auto mb-6 text-gray-300" />
                                <h2 className="font-display text-2xl text-gray-900 mb-2">Your cart is empty</h2>
                                <p className="text-gray-500 font-light text-sm mb-8">Discover our collection and find something beautiful.</p>
                                <button onClick={() => window.location.href = '/'} className="border border-black text-black px-8 py-3 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
                                {/* ── Left: Product List ─────────────────────────── */}
                                <div className="lg:col-span-2 space-y-6">
                                    {invalidItems.length > 0 && (
                                        <div className="border border-red-200 bg-red-50 p-6 rounded-lg">
                                            <p className="text-red-800 text-sm font-medium mb-3">⚠️ {checkoutMsg}</p>
                                            <p className="text-xs text-red-600 mb-3">Please remove these unavailable products before checking out:</p>
                                            <ul className="space-y-1">
                                                {invalidItems.map((name, i) => (
                                                    <li key={i} className="text-xs text-red-700 flex items-center gap-2">
                                                        <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                                                        {name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        {items.map((item) => {
                                            const pid = item.product_id
                                            const name = item.name || `Product #${pid}`
                                            const img = item.imagepath || ''
                                            const article = item.ArticleType || ''
                                            const colour = item.BaseColour || ''
                                            const price = "$129.00" // Mock price
                                            const isRemoving = removing === pid
                                            const isInvalid = invalidItems.some(n => n === name)

                                            return (
                                                <div key={pid} className={`bg-white p-6 flex gap-6 border-b border-gray-100 last:border-b-0 transition-opacity ${isRemoving ? 'opacity-40' : ''} ${isInvalid ? 'bg-red-50/50 relative' : ''}`}>
                                                    {isInvalid && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}

                                                    {/* Image */}
                                                    <div
                                                        className="w-24 h-32 flex-shrink-0 bg-gray-100 overflow-hidden cursor-pointer group"
                                                        onClick={() => setDetailProduct(item)}
                                                    >
                                                        {img ? (
                                                            <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">{article || 'No image'}</div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 flex flex-col justify-between py-1">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h3
                                                                    className="font-medium text-gray-900 text-base line-clamp-2 cursor-pointer hover:underline underline-offset-4"
                                                                    onClick={() => setDetailProduct(item)}
                                                                >
                                                                    {name}
                                                                </h3>
                                                                <span className="font-medium text-gray-900 ml-4">{price}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-500 font-light">{article}{colour ? ` · ${colour}` : ''}</p>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-auto pt-4">
                                                            <button
                                                                onClick={() => setDetailProduct(item)}
                                                                className="text-gray-500 hover:text-black transition-colors flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
                                                            >
                                                                <Info size={14} /> Details
                                                            </button>

                                                            <button
                                                                onClick={() => handleRemove(pid)}
                                                                disabled={isRemoving}
                                                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
                                                            >
                                                                <Trash2 size={14} /> Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* ── Right: Order Summary ───────────────────────── */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white p-8 sticky top-32 border border-gray-100 shadow-sm rounded-xl">
                                        <h3 className="font-display text-2xl mb-8 text-gray-900 italic">Order Summary</h3>

                                        <div className="space-y-4 text-sm font-light text-gray-600 mb-8 border-b border-gray-100 pb-8">
                                            <div className="flex justify-between">
                                                <span>Subtotal</span>
                                                <span className="text-gray-900 font-medium">{subtotal > 0 ? `$${subtotal.toFixed(2)}` : '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Estimated Tax</span>
                                                <span className="text-gray-900 font-medium">—</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Shipping</span>
                                                <span className="text-green-600 font-medium">Free</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mb-8">
                                            <span className="text-base text-gray-900">Total</span>
                                            <span className="text-2xl font-medium text-gray-900">{subtotal > 0 ? `$${subtotal.toFixed(2)}` : '—'}</span>
                                        </div>

                                        {checkout === 'error' && invalidItems.length === 0 && (
                                            <p className="text-red-500 text-xs mb-4 text-center p-3 bg-red-50 rounded">{checkoutMsg}</p>
                                        )}

                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkout === 'loading'}
                                            className="w-full bg-black text-white py-4 text-sm tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors disabled:opacity-70 flex justify-center items-center"
                                        >
                                            {checkout === 'loading' ? (
                                                <>
                                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Processing
                                                </>
                                            ) : 'Proceed to Checkout'}
                                        </button>

                                        <p className="text-center text-xs text-gray-400 mt-4 font-light">
                                            Secure checkout powered by Stripe
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Product Detail Modal */}
                {detailProduct && (
                    <ProductDetailModal
                        product={detailProduct}
                        onClose={() => setDetailProduct(null)}
                        showCart={false}
                        showRate={true}
                    />
                )}
            </div>
        </div>
    )
}
