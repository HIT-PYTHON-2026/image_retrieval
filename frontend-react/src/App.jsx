import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import BrandPage from './pages/BrandPage'
import CartPage from './pages/CartPage'

export default function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" richColors />
            <BrowserRouter>
                <Navbar />
                {/* pt-16 để không bị Navbar che */}
                <main className="pt-16 min-h-screen">
                    <Routes>
                        {/* Public */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected — any logged-in user */}
                        <Route path="/" element={
                            <ProtectedRoute><HomePage /></ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={
                            <ProtectedRoute><DashboardPage /></ProtectedRoute>
                        } />
                        <Route path="/cart" element={
                            <ProtectedRoute><CartPage /></ProtectedRoute>
                        } />

                        {/* Protected — brand only */}
                        <Route path="/brand" element={
                            <ProtectedRoute requiredRole="brand"><BrandPage /></ProtectedRoute>
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </AuthProvider>
    )
}
