import { useState } from 'react'
import { rateProductAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// Modal đánh giá sản phẩm 1-5 sao
export default function RatingModal({ product, onClose, onSuccess }) {
    const { user } = useAuth()
    const [selected, setSelected] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!selected) {
            toast.error('Please select a rating')
            return
        }
        setLoading(true)
        try {
            await rateProductAPI(user.user_id, product.product_id, selected)
            toast.success('Rating submitted successfully')
            onSuccess?.()
            onClose()
        } catch (e) {
            toast.error(e.response?.data?.detail || 'Failed to submit rating')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white p-8 sm:p-10 w-full max-w-sm shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <h3 className="font-display text-2xl text-gray-900 mb-2">Rate Product</h3>
                        <p className="text-gray-500 text-sm font-light leading-relaxed line-clamp-2">
                            {product?.name ?? 'Product'}
                        </p>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-4 mb-6 justify-center">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                className={`text-4xl transition-all ${n <= (hovered || selected) ? 'text-black scale-110 drop-shadow-sm' : 'text-gray-200 hover:text-gray-300'}`}
                                onMouseEnter={() => setHovered(n)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setSelected(n)}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    <div className="h-6 mb-8 text-center">
                        {selected > 0 && (
                            <p className="text-black text-xs uppercase tracking-widest font-medium animate-in fade-in zoom-in duration-300">
                                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][selected]}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selected}
                        className="w-full bg-black text-white py-4 text-sm uppercase tracking-widest font-medium hover:bg-gray-900 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {loading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
