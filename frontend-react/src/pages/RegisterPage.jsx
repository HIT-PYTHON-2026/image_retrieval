import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAPI } from '../services/api'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const ROLES = ['customer', 'brand']
const GENDERS = ['Male', 'Female', 'Unisex']

export default function RegisterPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'customer', gender: 'Male' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const payload = {
                full_name: form.full_name,
                email: form.email,
                password: form.password,
                role: form.role,
                gender: form.role === 'customer' ? form.gender : 'Unisex',
            }
            await registerAPI(payload)
            setSuccess(true)
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* ── Left: Elegance Banner ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-100 flex-col items-center justify-center">
                <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                    alt="Fashion background"
                />
                <div className="absolute inset-0 bg-black/40" />

                <motion.div
                    className="relative z-10 text-center px-12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="font-display text-5xl text-white mb-4 tracking-widest italic">VOGUE FIND</div>
                    <p className="text-white/90 text-sm tracking-widest uppercase font-light">Join the Fashion Revolution</p>
                </motion.div>
            </div>

            {/* ── Right: Register Form ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">

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
                        <h1 className="font-display text-4xl mb-3 text-gray-900">Create Account</h1>
                        <p className="text-gray-500 text-sm font-light mb-10">Join Vogue Find to save your styles</p>

                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12 border border-gray-200 rounded-2xl bg-gray-50"
                            >
                                <div className="text-green-600 text-5xl mb-4">✓</div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome aboard</h3>
                                <p className="text-gray-500 text-sm font-light">Account created! Redirecting to login...</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Full Name</label>
                                    <input
                                        type="text" required value={form.full_name} onChange={set('full_name')}
                                        className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors text-sm"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Email</label>
                                    <input
                                        type="email" required value={form.email} onChange={set('email')}
                                        className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors text-sm"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Password</label>
                                    <input
                                        type="password" required value={form.password} onChange={set('password')}
                                        className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-1">
                                        <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Role</label>
                                        <select
                                            value={form.role} onChange={set('role')}
                                            className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent focus:border-black focus:outline-none transition-colors text-sm"
                                        >
                                            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    {form.role === 'customer' && (
                                        <div className="space-y-1">
                                            <label className="block text-xs text-gray-500 uppercase tracking-widest font-medium">Gender</label>
                                            <select
                                                value={form.gender} onChange={set('gender')}
                                                className="w-full border-b border-gray-300 py-3 text-gray-900 bg-transparent focus:border-black focus:outline-none transition-colors text-sm"
                                            >
                                                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full bg-black text-white py-4 mt-8 text-sm tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors disabled:opacity-70 flex justify-center items-center"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
                                </button>
                            </form>
                        )}

                        <p className="mt-8 justify-center flex gap-2 text-sm text-gray-500 font-light">
                            Already have an account?
                            <Link to="/login" className="text-black font-medium hover:underline">Sign in</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
