import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Vitals from './pages/Vitals'
import Sharing from './pages/Sharing'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        )
    }

    return user ? children : <Navigate to="/login" />
}

function App() {
    const { user } = useAuth()

    return (
        <div className="app">
            {user && <Navbar />}
            <main className={user ? 'main-content' : 'auth-content'}>
                <Routes>
                    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                    <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    } />
                    <Route path="/vitals" element={
                        <ProtectedRoute>
                            <Vitals />
                        </ProtectedRoute>
                    } />
                    <Route path="/sharing" element={
                        <ProtectedRoute>
                            <Sharing />
                        </ProtectedRoute>
                    } />
                </Routes>
            </main>
        </div>
    )
}

export default App
