import { createContext, useContext, useState, useEffect } from 'react'
import { loginAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)     // { user_id, full_name, role, gender }
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    // Khôi phục session từ localStorage khi app khởi động
    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser))
            setToken(storedToken)
        }
        setLoading(false)
    }, [])

    // Login → gọi API, lưu token + user vào localStorage
    const login = async (email, password) => {
        const res = await loginAPI(email, password)
        const { user_infor, access_token } = res.data
        setUser(user_infor)
        setToken(access_token)
        localStorage.setItem('user', JSON.stringify(user_infor))
        localStorage.setItem('token', access_token)
        return user_infor
    }

    // Logout → xóa state + localStorage
    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook để dùng cho các component
export const useAuth = () => useContext(AuthContext)
