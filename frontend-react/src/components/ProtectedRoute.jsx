import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Bảo vệ route: chỉ cho phép user đã đăng nhập (và đúng role nếu cần)
export default function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gold animate-pulse font-display text-2xl">✦ VOGUE FIND ✦</div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />
    if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />

    return children
}
