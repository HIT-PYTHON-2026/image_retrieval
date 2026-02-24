import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from './ui/Card'
import { ShoppingBag, Star } from 'lucide-react'

export default function TrendingCollection({ products, loading, userId, onAddToCart, addingId, onViewDetail }) {
    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 })

    if (!loading && products?.length === 0) return null

    return (
        <section ref={sectionRef} className="py-24 px-6 lg:px-12 bg-[#fafafa]">
            <div className="max-w-[1600px] mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -50 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 italic font-display">
                            Trending Now
                        </h2>
                        <p className="text-gray-500 max-w-md font-light leading-relaxed">
                            Discover the most loved pieces chosen by our community.
                            Elegance meets comfort for the modern lifestyle.
                        </p>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 xl:gap-8">
                        {products.map((item, index) => {
                            const name = item.productdisplayname || item.ProductDisplayName || item['Product Display Name'] || item.name || 'Unknown'
                            const img = item.imagepath || item.ImagePath || item.image || ''
                            const article = item.articletype || item.ArticleType || item['Article Type'] || ''
                            const price = "$129" // Mock price since we don't have it
                            const avgRating = parseFloat(item.avg_rating ?? item['averange point'] ?? 0)
                            const filled = Math.round(avgRating)
                            const pid = item.product_id || item.Id || item.id

                            return (
                                <motion.div
                                    key={pid}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Card className="overflow-hidden group cursor-pointer border-transparent hover:border-gray-200 transition-all shadow-sm hover:shadow-md" onClick={() => onViewDetail(item)}>
                                        <CardContent className="p-0">
                                            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                                {img ? (
                                                    <img
                                                        src={img}
                                                        alt={name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                                )}

                                                {/* Hover Overlay Button */}
                                                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 to-transparent">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onAddToCart(item) }}
                                                        disabled={addingId === pid}
                                                        className="w-full bg-white text-black py-3 text-xs tracking-widest font-medium uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                                                    >
                                                        <ShoppingBag size={14} />
                                                        {addingId === pid ? 'Adding...' : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{article}</p>
                                                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">{name}</h3>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-900 font-medium">{price}</p>
                                                    {avgRating > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                                                            <Star size={12} className="fill-current" />
                                                            {avgRating.toFixed(1)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
