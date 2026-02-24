import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { searchAPI, addToCartAPI, getTopRatedAPI } from '../services/api'
import ProductDetailModal from '../components/ProductDetailModal'
import { SlidersHorizontal, ShoppingBag, Star } from 'lucide-react'
import { toast } from 'sonner'
import HeroSection from '../components/HeroSection'
import TrendingCollection from '../components/TrendingCollection'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../components/ui/Card'

const FILTER_OPTIONS = {
    gender: ['All', 'Men', 'Women', 'Boys', 'Girls', 'Unisex'],
    colour: ['All', 'Black', 'White', 'Blue', 'Red', 'Green', 'Grey', 'Beige', 'Navy Blue', 'Multi'],
    season: ['All', 'Summer', 'Winter', 'Fall', 'Spring'],
    usage: ['All', 'Casual', 'Formal', 'Sports', 'Party', 'Ethnic', 'Smart Casual'],
}

// ResultCard Component
function ResultCard({ product, userId, onAddToCart, addingId, onViewDetail }) {
    const name = product.productdisplayname || product.ProductDisplayName || product['Product Display Name'] || product.name || 'Unknown'
    const img = product.imagepath || product.ImagePath || product.image || ''
    const article = product.articletype || product.ArticleType || product['Article Type'] || ''
    const avgRating = parseFloat(product.avg_rating ?? product['averange point'] ?? 0)
    const pid = product.product_id || product.Id || product.id

    return (
        <Card className="overflow-hidden group cursor-pointer border-transparent hover:border-gray-200 transition-all shadow-sm hover:shadow-md" onClick={() => onViewDetail(product)}>
            <CardContent className="p-0">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    {img ? (
                        <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
                            disabled={addingId === pid}
                            className="w-full bg-white text-black py-3 text-xs tracking-widest font-medium uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={14} />
                            {addingId === pid ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{article}</p>
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">{name}</h3>
                    {avgRating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Star size={12} className="fill-current" />
                            {avgRating.toFixed(1)}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function HomePage() {
    const { user } = useAuth()

    // Search state
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState([])
    const [showFilter, setShowFilter] = useState(false)
    const [filters, setFilters] = useState({ gender: 'All', colour: 'All', season: 'All', usage: 'All' })

    // Cart state
    const [addingId, setAddingId] = useState(null)

    // Top rated state
    const [topRated, setTopRated] = useState([])
    const [topLoading, setTopLoading] = useState(true)

    // Modal state
    const [detailProduct, setDetailProduct] = useState(null)

    useEffect(() => {
        getTopRatedAPI(10)
            .then(r => setTopRated(r.data?.data || []))
            .catch(() => { })
            .finally(() => setTopLoading(false))
    }, [])

    const handleSearch = async (file) => {
        if (!file) return

        if (!user?.user_id) {
            toast.error('Vui lòng đăng nhập để sử dụng tính năng AI Search (Lưu lịch sử).')
            return
        }

        setLoading(true)
        try {
            const res = await searchAPI(file, user.user_id)
            setResults(res.data?.data || [])
            if (res.data?.data?.length === 0) {
                toast.info('No similar items found.')
            } else {
                // scroll to results automatically
                setTimeout(() => window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' }), 300)
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Search failed.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = async (product) => {
        if (!user?.user_id) {
            toast.error('Please login to add to cart.')
            return
        }
        const pid = product.product_id || product.Id || product.id
        setAddingId(pid)
        try {
            await addToCartAPI(user.user_id, pid)
            toast.success('Added to cart successfully!')
        } catch (err) {
            const detail = err.response?.data?.detail
            const msg = typeof detail === 'string' ? detail
                : Array.isArray(detail) ? detail.map(d => d.msg || '').join(', ')
                    : 'Error adding to cart'
            toast.error(msg)
        } finally {
            setAddingId(null)
        }
    }

    const filtered = results.filter(p => {
        const g = p.Gender || p.gender || ''
        const c = p.BaseColour || p.basecolour || ''
        const s = p.Season || p.season || ''
        const u = p.Usage || p.usage || ''
        return (
            (filters.gender === 'All' || g === filters.gender) &&
            (filters.colour === 'All' || c === filters.colour) &&
            (filters.season === 'All' || s === filters.season) &&
            (filters.usage === 'All' || u === filters.usage)
        )
    })

    return (
        <div className="min-h-screen bg-white">

            <HeroSection onSearch={handleSearch} loading={loading} />

            {/* Render Search Results if present */}
            {results.length > 0 && (
                <section className="py-24 px-6 lg:px-12 bg-white border-t border-gray-100">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                            <div>
                                <h2 className="text-3xl font-light text-gray-900 mb-2 italic font-display">Search Results</h2>
                                <p className="text-gray-500 font-light">Found {filtered.length} similar items from our collection</p>
                            </div>
                            <button onClick={() => setShowFilter(v => !v)}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mt-4 md:mt-0 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <SlidersHorizontal size={14} /> Filter Collection
                            </button>
                        </div>

                        {showFilter && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-gray-50 p-6 rounded-xl mb-10 grid grid-cols-2 md:grid-cols-4 gap-6"
                            >
                                {Object.entries(FILTER_OPTIONS).map(([key, options]) => (
                                    <div key={key}>
                                        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">{key}</label>
                                        <select value={filters[key]} onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 text-gray-800 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-sm transition-all focus:border-black">
                                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 xl:gap-8">
                            {filtered.map((p, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    key={`search-${i}`}
                                >
                                    <ResultCard product={p} userId={user?.user_id} onAddToCart={handleAddToCart} addingId={addingId} onViewDetail={setDetailProduct} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <TrendingCollection
                products={topRated}
                loading={topLoading}
                userId={user?.user_id}
                onAddToCart={handleAddToCart}
                addingId={addingId}
                onViewDetail={setDetailProduct}
            />

            {/* Product Detail Modal */}
            {detailProduct && (
                <ProductDetailModal
                    product={detailProduct}
                    onClose={() => setDetailProduct(null)}
                    showCart={true}
                    showRate={true}
                />
            )}
        </div>
    )
}
