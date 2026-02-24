import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTopRatedAPI } from '../services/api'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [topImages, setTopImages] = useState([])

    useEffect(() => {
        getTopRatedAPI(9)
            .then(r => {
                const imgs = (r.data?.data || [])
                    .map(p => p.imagepath || p.ImagePath || '')
                    .filter(Boolean)
                setTopImages(imgs)
            })
            .catch(() => { })
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const user = await login(form.email, form.password)
            navigate(user.role === 'brand' ? '/brand' : '/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const slots = Array.from({ length: 9 }, (_, i) => topImages[i] || null)

    return (
        <div className="min-h-screen flex bg-white">
            {/* ── Left: Product Image Grid ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-100 flex-col items-center justify-center">

                {/* Minimalist overlays */}
                <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

                {/* Image grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
                    {slots.map((img, i) => (
                        <motion.div
                            key={i}
                            className="bg-gray-200 overflow-hidden"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        >
                            {img ? (
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 animate-pulse" />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Text overlay */}
                <motion.div
                    className="relative z-20 text-center px-12 mt-auto pb-24"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    <div className="font-display text-5xl text-white mb-3 tracking-widest italic opacity-90">
                        VOGUE FIND
                    </div>
                    <p className="text-gray-200 text-sm tracking-widest uppercase font-light">
                        AI-Powered Fashion Discovery
                    </p>
                </motion.div>

                {topImages.length > 0 && (
                    <motion.div
                        className="absolute top-8 left-8 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="bg-white/90 text-black text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 backdrop-blur-md">
                            Top Rated Edit
                        </span>
                    </motion.div>
                )}
            </div>

            {/* ── Right: Login Form ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">

                {/* Back to Home - absolute top right */}
                <Link to="/" className="absolute top-8 right-8 text-sm text-gray-500 hover:text-black transition-colors font-light">
                    Cancel
                </Link>

                <div className="w-full max-w-sm">
                    <div className="block lg:hidden font-display text-3xl italic text-black mb-12 text-center tracking-widest">
                        VOGUE FIND
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h1 className="font-display text-4xl mb-3 text-gray-900">Welcome Back</h1>
                        <p className="text-gray-500 text-sm font-light mb-10">Sign in to your account to continue</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors text-sm"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors text-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-4 mt-4 text-sm tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors disabled:opacity-70 flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                            </button>
                        </form>

                        <p className="mt-8 justify-center flex gap-2 text-sm text-gray-500 font-light">
                            Don't have an account?
                            <Link to="/register" className="text-black font-medium hover:underline">Sign up</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
