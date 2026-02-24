import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, LogOut, LayoutDashboard, Store, Menu, X } from 'lucide-react'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Check if we are on the home page styling
    const isHome = location.pathname === '/'

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
        setIsMobileMenuOpen(false)
    }

    const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6 lg:px-12 py-6 ${isScrolled || !isHome ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent'
        }`

    const textClass = isScrolled || !isHome ? 'text-gray-900' : 'text-gray-800'

    return (
        <nav className={navClasses}>
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className={`font-display text-2xl tracking-widest italic ${textClass}`}>
                    VOGUE FIND
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    {user ? (
                        <>
                            <Link to="/" className={`text-sm font-light tracking-wide hover:text-gray-500 transition-colors ${textClass}`}>
                                Search
                            </Link>

                            {user.role === 'brand' ? (
                                <Link to="/brand" className={`flex items-center gap-2 text-sm font-light tracking-wide hover:text-gray-500 transition-colors ${textClass}`}>
                                    <Store size={16} /> Brand
                                </Link>
                            ) : (
                                <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-light tracking-wide hover:text-gray-500 transition-colors ${textClass}`}>
                                    <LayoutDashboard size={16} /> Dashboard
                                </Link>
                            )}

                            <Link to="/cart" className={`relative flex items-center gap-2 text-sm font-light tracking-wide hover:text-gray-500 transition-colors ${textClass}`}>
                                <ShoppingCart size={18} />
                                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    2
                                </span>
                            </Link>

                            <div className="flex items-center gap-4 ml-4 pl-6 border-l border-gray-300">
                                <span className={`text-sm font-light ${textClass}`}>{user.full_name}</span>
                                <button onClick={handleLogout} className={`hover:text-red-500 transition-colors ${textClass}`} title="Logout">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={`text-sm font-light tracking-wide hover:text-gray-500 transition-colors ${textClass}`}>
                                Login
                            </Link>
                            <Link to="/register" className="bg-black text-white px-5 py-2 text-sm font-light tracking-wide hover:bg-gray-800 transition-colors">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden text-gray-900 z-50 relative"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} className={isMobileMenuOpen ? 'text-white' : ''} /> : <Menu size={24} className={textClass} />}
                </button>
            </div>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-40 lg:hidden flex flex-col items-center justify-center text-white"
                    >
                        <div className="flex flex-col items-center gap-8 w-full px-6">
                            {user ? (
                                <>
                                    <p className="text-gray-400 font-light mb-4">Welcome, {user.full_name}</p>
                                    <Link to="/" className="text-2xl font-light hover:text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>Search</Link>

                                    {user.role === 'brand' ? (
                                        <Link to="/brand" className="text-2xl font-light hover:text-gray-300 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Store size={20} /> Brand Dashboard
                                        </Link>
                                    ) : (
                                        <Link to="/dashboard" className="text-2xl font-light hover:text-gray-300 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                            <LayoutDashboard size={20} /> Dashboard
                                        </Link>
                                    )}

                                    <Link to="/cart" className="text-2xl font-light hover:text-gray-300 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                        <ShoppingCart size={20} /> Cart
                                    </Link>

                                    <button onClick={handleLogout} className="mt-8 text-xl font-light text-red-400 hover:text-red-300 flex items-center gap-2">
                                        <LogOut size={20} /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-3xl font-light hover:text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                    <Link to="/register" className="text-3xl font-light hover:text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
