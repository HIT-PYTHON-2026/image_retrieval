import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSearchHistoryAPI, getOrderHistoryAPI, rateProductAPI, addToCartAPI } from '../services/api'
import RatingModal from '../components/RatingModal'
import { Clock, ShoppingBag, X, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

function ProductDetailPanel({ product, onClose }) {
    const { user } = useAuth()
    const [ratingHover, setRatingHover] = useState(0)
    const [currentRating, setCurrentRating] = useState(Math.round(parseFloat(product['averange point'] || 0)))
    const [loadingRating, setLoadingRating] = useState(false)
    const [addingCart, setAddingCart] = useState(false)

    if (!product) return null

    const name = product['Product Display Name'] || product.name || 'Unknown Product'
    const img = product.imagepath || product.image || ''
    const article = product['Article Type'] || product.ArticleType || ''
    const colour = product['Base Colour'] || ''
    const gender = product.Gender || ''
    const season = product.Season || ''
    const usage = product.Usage || ''

    const handleRate = async (stars) => {
        setLoadingRating(true)
        try {
            await rateProductAPI(user.user_id, product.Id || product.product_id, stars)
            setCurrentRating(stars)
            toast.success('Rating submitted successfully')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit rating.')
        } finally {
            setLoadingRating(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-[360px] shrink-0 bg-white border-l border-gray-100 flex flex-col h-[calc(100vh-100px)] sticky top-24 overflow-y-auto shadow-sm"
        >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur z-10">
                <h2 className="font-display text-xl text-gray-900 pr-4 leading-tight italic">{name}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-black mt-1 shrink-0 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
            </div>

            {/* Image */}
            <div className="w-full aspect-[3/4] bg-gray-50 relative group">
                {img ? (
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
                <div className="absolute bottom-4 right-4 bg-white/90 text-black px-3 py-1.5 text-[10px] font-bold tracking-widest backdrop-blur-md shadow-sm uppercase">
                    ID: {product.Id || product.product_id}
                </div>
            </div>

            {/* Details */}
            <div className="p-6 flex-1 flex flex-col gap-8">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5 font-medium">Article Type</p>
                        <p className="text-gray-900 font-light">{article}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5 font-medium">Color</p>
                        <p className="text-gray-900 font-light">{colour}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5 font-medium">Gender</p>
                        <p className="text-gray-900 font-light">{gender}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5 font-medium">Season</p>
                        <p className="text-gray-900 font-light">{season} {product.Year || ''}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1.5 font-medium">Usage</p>
                        <p className="text-gray-900 font-light">{usage}</p>
                    </div>
                </div>

                {/* Rating Section */}
                <div className="pt-6 border-t border-gray-100">
                    <p className="text-gray-900 text-xs tracking-widest mb-4 font-medium uppercase">Rate This Product</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                className={`text-2xl transition-all ${star <= (ratingHover || currentRating) ? 'text-black scale-110 drop-shadow-sm' : 'text-gray-200 hover:text-gray-400'}`}
                                onMouseEnter={() => setRatingHover(star)}
                                onMouseLeave={() => setRatingHover(0)}
                                onClick={() => handleRate(star)}
                                disabled={loadingRating}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-8">
                    <button
                        className="w-full bg-black text-white flex items-center justify-center gap-2 py-4 tracking-widest text-sm uppercase font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                        disabled={addingCart}
                        onClick={async () => {
                            setAddingCart(true)
                            try {
                                await addToCartAPI(user.user_id, product.Id || product.product_id)
                                toast.success('Added to cart')
                            } catch (e) {
                                toast.error(e.response?.data?.detail || 'Failed to add item')
                            } finally {
                                setAddingCart(false)
                            }
                        }}
                    >
                        {addingCart ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ShoppingCart size={16} strokeWidth={2} />
                        )}
                        {addingCart ? 'Adding...' : 'Add To Cart'}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [tab, setTab] = useState('search')

    // Search history
    const [searchHistory, setSearchHistory] = useState([])
    const [searchLoading, setSearchLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState(null)

    // Order history
    const [orderHistory, setOrderHistory] = useState([])
    const [orderLoading, setOrderLoading] = useState(false)

    // Rating modal for orders
    const [ratingProduct, setRatingProduct] = useState(null)

    useEffect(() => {
        getSearchHistoryAPI(user.user_id)
            .then(r => setSearchHistory(r.data?.data || []))
            .catch(() => { })
            .finally(() => setSearchLoading(false))
    }, [user.user_id])

    const loadOrders = () => {
        setOrderLoading(true)
        getOrderHistoryAPI(user.user_id)
            .then(r => setOrderHistory(r.data?.data || []))
            .catch(() => setOrderHistory([]))
            .finally(() => setOrderLoading(false))
    }

    const handleTabChange = (t) => {
        setTab(t)
        if (t === 'orders') {
            loadOrders()
            setSelectedProduct(null)
        }
    }

    return (
        <div className="min-h-screen bg-[#fafafa] pt-28 pb-20 px-6 lg:px-12">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-12 border-b border-gray-200 pb-8">
                    <h1 className="font-display text-4xl md:text-5xl text-gray-900 italic mb-3">My Dashboard</h1>
                    <p className="text-gray-500 font-light">Welcome back, <span className="text-black font-medium">{user.full_name}</span></p>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-10 overflow-x-auto scrollbar-hide">
                    <button
                        className={`pb-4 text-sm tracking-widest uppercase font-medium transition-colors whitespace-nowrap border-b-2 ${tab === 'search' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleTabChange('search')}
                    >
                        <Clock size={16} className="inline mr-2 -mt-0.5" /> Search History
                    </button>
                    <button
                        className={`pb-4 text-sm tracking-widest uppercase font-medium transition-colors whitespace-nowrap border-b-2 ${tab === 'orders' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleTabChange('orders')}
                    >
                        <ShoppingBag size={16} className="inline mr-2 -mt-0.5" /> Order History
                    </button>
                </div>

                <div className="flex gap-10 items-start relative">
                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Search History Tab */}
                        {tab === 'search' && (
                            <div>
                                {searchLoading ? (
                                    <div className="flex justify-center py-32">
                                        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                                    </div>
                                ) : searchHistory.length === 0 ? (
                                    <div className="text-center py-32 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <Clock size={48} strokeWidth={1} className="mx-auto mb-6 text-gray-300" />
                                        <h2 className="font-display text-2xl text-gray-900 mb-2">No search history</h2>
                                        <p className="text-gray-500 font-light text-sm">Upload images to discover similar fashion items.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {searchHistory.map((item, i) => {
                                            const ts = String(item.timestamp || '').replace('T', ' ').slice(0, 19)
                                            const results = item.results || []
                                            const img = item.image_path || item.query_image_path || ''

                                            return (
                                                <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row gap-8">
                                                        {/* Query Image section */}
                                                        <div className="w-full sm:w-40 flex flex-col gap-3 shrink-0">
                                                            <div className="text-xs text-gray-500 font-light whitespace-nowrap">{ts}</div>
                                                            <div className="w-full aspect-[3/4] bg-gray-50 overflow-hidden relative border border-gray-100 group">
                                                                {img && String(img) !== '0' ? (
                                                                    <img src={String(img)} alt="query" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                                                                )}
                                                                <div className="absolute top-2 left-2 bg-black/80 text-[10px] uppercase tracking-widest px-2 py-1 text-white backdrop-blur-sm">
                                                                    Query
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-black border border-gray-200 px-3 py-1.5 text-center mt-auto font-medium">
                                                                {results.length} Matches
                                                            </div>
                                                        </div>

                                                        {/* Results grid */}
                                                        <div className="flex-1 sm:border-l sm:border-gray-100 sm:pl-8">
                                                            <p className="text-xs text-gray-400 mb-4 tracking-widest uppercase font-medium">Visual Search Results</p>
                                                            {results.length > 0 ? (
                                                                <div className={`grid gap-4 transition-all ${selectedProduct ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'}`}>
                                                                    {results.map((product) => {
                                                                        const isSelected = selectedProduct?.Id === product.Id;
                                                                        return (
                                                                            <div
                                                                                key={product.Id}
                                                                                onClick={() => setSelectedProduct(product)}
                                                                                className={`aspect-[3/4] cursor-pointer overflow-hidden relative transition-all duration-300 ${isSelected ? 'ring-2 ring-black scale-105 z-10 shadow-lg' : 'hover:opacity-80'}`}
                                                                            >
                                                                                {product.imagepath ? (
                                                                                    <img src={product.imagepath} alt={product['Product Display Name'] || 'Result'} className="w-full h-full object-cover bg-gray-50" />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-400">No Image</div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500 font-light italic">No detailed results found.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order History Tab */}
                        {tab === 'orders' && (
                            <div>
                                {orderLoading ? (
                                    <div className="flex justify-center py-32">
                                        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                                    </div>
                                ) : orderHistory.length === 0 ? (
                                    <div className="text-center py-32 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <ShoppingBag size={48} strokeWidth={1} className="mx-auto mb-6 text-gray-300" />
                                        <h2 className="font-display text-2xl text-gray-900 mb-2">No orders yet</h2>
                                        <p className="text-gray-500 font-light text-sm">When you buy items, they will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-4xl">
                                        {orderHistory.map((order, i) => (
                                            <div key={order.order_batch_id || i} className="bg-white border border-gray-100 shadow-sm p-6 lg:p-8 rounded-xl">
                                                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        Order #{order.order_batch_id || i + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-500 font-light">{String(order.created_at || '').slice(0, 10)}</span>
                                                </div>
                                                <div className="space-y-4">
                                                    {(Array.isArray(order.items) ? order.items : []).map((item, j) => (
                                                        <div key={j} className="flex items-center gap-6">
                                                            <div className="w-20 h-28 bg-gray-50 flex-shrink-0 overflow-hidden">
                                                                {item.imagepath ? (
                                                                    <img src={item.imagepath} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No image</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-base text-gray-900 font-medium">{item.name || `Product #${item.product_id}`}</p>
                                                                <p className="text-sm text-gray-500 font-light mt-1">Item ID: {item.product_id}</p>
                                                            </div>
                                                            <button
                                                                className="border border-gray-200 text-gray-900 hover:border-black hover:bg-black hover:text-white transition-colors text-xs py-2 px-4 uppercase tracking-widest font-medium flex gap-2 items-center shrink-0"
                                                                onClick={() => setRatingProduct({ product_id: item.product_id, name: item.name })}
                                                            >
                                                                ★ Rate Item
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side Panel */}
                    <AnimatePresence>
                        {tab === 'search' && selectedProduct && (
                            <ProductDetailPanel
                                product={selectedProduct}
                                onClose={() => setSelectedProduct(null)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Rating modal for Orders */}
                {ratingProduct && (
                    <RatingModal
                        product={ratingProduct}
                        onClose={() => setRatingProduct(null)}
                        onSuccess={() => {
                            setRatingProduct(null)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
