import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addToCartAPI, rateProductAPI } from '../services/api'
import { X, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Modal hiển thị chi tiết sản phẩm — dùng chung cho HomePage, CartPage, DashboardPage
 * Props:
 *   product  : object với các field: product_id/Id/ID, name/ProductDisplayName, imagepath/ImagePath,
 *              Gender, ArticleType, BaseColour, Season, Usage, avg_rating, total_reviews
 *   onClose  : () => void
 *   showCart : bool  (hiện nút Add to Cart, mặc định true)
 *   showRate : bool  (hiện stars để rate, mặc định false)
 */
export default function ProductDetailModal({ product, onClose, showCart = true, showRate = false }) {
    const { user } = useAuth()
    const [addingCart, setAddingCart] = useState(false)
    const [ratingHover, setRatingHover] = useState(0)
    const [currentRating, setCurrentRating] = useState(
        Math.round(parseFloat(product?.avg_rating || product?.['averange point'] || 0))
    )
    const [ratingLoading, setRatingLoading] = useState(false)

    if (!product) return null

    // Normalize field names
    const pid = product.product_id || product.Id || product.ID || product.id
    const name = product.name
        || product.ProductDisplayName || product.productdisplayname
        || product['Product Display Name']
        || `Product #${pid}`
    const img = product.imagepath || product.ImagePath || product.image || ''
    const gender = product.Gender || product.gender || ''
    const article = product.ArticleType || product.articletype || product['Article Type'] || ''
    const colour = product.BaseColour || product.basecolour || product['Base Colour'] || ''
    const season = product.Season || product.season || ''
    const usage = product.Usage || product.usage || ''
    const category = product.MasterCategory || product.mastercategory || product['Master Category'] || ''
    const subcat = product.SubCategory || product.subcategory || product['Sub Category'] || ''
    const year = product.Year || product.year || ''
    const avgRating = parseFloat(product.avg_rating ?? product['averange point'] ?? 0)
    const totalReviews = parseInt(product.total_reviews ?? product.Count_Rating ?? 0)

    const handleAddToCart = async () => {
        setAddingCart(true)
        try {
            await addToCartAPI(user.user_id, pid)
            toast.success('Added to cart')
        } catch (e) {
            toast.error(e.response?.data?.detail || 'Error adding to cart')
        } finally {
            setAddingCart(false)
        }
    }

    const handleRate = async (stars) => {
        setRatingLoading(true)
        try {
            await rateProductAPI(user.user_id, pid, stars)
            setCurrentRating(stars)
            toast.success('Rating saved')
        } catch (e) {
            toast.error(e.response?.data?.detail || 'Rating failed')
        } finally {
            setRatingLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative bg-white border border-gray-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur border border-gray-100 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>

                    {/* Image */}
                    <div className="w-full md:w-[400px] flex-shrink-0 aspect-[3/4] md:aspect-auto bg-gray-50 relative group">
                        {img ? (
                            <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                        <div className="absolute bottom-4 right-4 bg-white/90 text-black px-3 py-1.5 text-[10px] font-bold tracking-widest backdrop-blur-md shadow-sm uppercase">
                            ID: {pid}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between">
                        <div className="space-y-6">
                            {/* Name & ID */}
                            <div>
                                <h2 className="font-display text-3xl leading-tight text-gray-900 italic mb-3">{name}</h2>
                                {(avgRating > 0 || totalReviews > 0) && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-black text-sm tracking-widest">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                                        <span className="text-gray-400 text-xs font-light">({avgRating} / {totalReviews} reviews)</span>
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-100" />

                            {/* Attributes */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                                {[['Category', category], ['Sub Category', subcat], ['Type', article], ['Color', colour], ['Gender', gender], ['Season', season], ['Usage', usage], ['Year', year]]
                                    .filter(([, v]) => v)
                                    .map(([label, val]) => (
                                        <div key={label}>
                                            <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-medium">{label}</p>
                                            <p className="text-gray-900 font-light">{val}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
                            {/* Rate section */}
                            {showRate && (
                                <div>
                                    <p className="text-gray-900 text-xs uppercase tracking-widest mb-3 font-medium">Rate this product</p>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                disabled={ratingLoading}
                                                className={`text-2xl transition-all ${star <= (ratingHover || currentRating) ? 'text-black scale-110 drop-shadow-sm' : 'text-gray-200 hover:text-gray-400'}`}
                                                onMouseEnter={() => setRatingHover(star)}
                                                onMouseLeave={() => setRatingHover(0)}
                                                onClick={() => handleRate(star)}
                                            >★</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add to Cart */}
                            {showCart && (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingCart}
                                    className="w-full bg-black text-white py-4 flex items-center justify-center gap-3 text-sm tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors disabled:opacity-70"
                                >
                                    {addingCart ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ShoppingCart size={16} strokeWidth={2} />
                                    )}
                                    {addingCart ? 'Adding to Cart...' : 'Add to Cart'}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
