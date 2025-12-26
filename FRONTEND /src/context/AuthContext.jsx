import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = 'http://localhost:5001/api'

// Configure axios defaults
axios.defaults.baseURL = API_URL

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (token && storedUser) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)

        // Add axios interceptor to handle expired tokens
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // Token expired or invalid - logout user
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    delete axios.defaults.headers.common['Authorization']
                    setUser(null)
                    window.location.href = '/login'
                }
                return Promise.reject(error)
            }
        )

        return () => axios.interceptors.response.eject(interceptor)
    }, [])

    const login = async (email, password) => {
        const response = await axios.post('/auth/login', { email, password })
        const { token, user } = response.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)

        return response.data
    }

    const register = async (name, email, password) => {
        const response = await axios.post('/auth/register', { name, email, password })
        const { token, user } = response.data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)

        return response.data
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
