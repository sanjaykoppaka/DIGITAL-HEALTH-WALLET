import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
    const { user, logout } = useAuth()

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <div className="navbar-logo-icon">💊</div>
                <h1>Health Wallet</h1>
            </div>

            <ul className="navbar-menu">
                <li className="navbar-item">
                    <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                        <span className="navbar-link-icon">📊</span>
                        <span>Dashboard</span>
                    </NavLink>
                </li>
                <li className="navbar-item">
                    <NavLink to="/reports" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                        <span className="navbar-link-icon">📄</span>
                        <span>Reports</span>
                    </NavLink>
                </li>
                <li className="navbar-item">
                    <NavLink to="/vitals" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                        <span className="navbar-link-icon">❤️</span>
                        <span>Vitals</span>
                    </NavLink>
                </li>
                <li className="navbar-item">
                    <NavLink to="/sharing" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                        <span className="navbar-link-icon">🔗</span>
                        <span>Sharing</span>
                    </NavLink>
                </li>
            </ul>

            <div className="navbar-user">
                <div className="navbar-user-info">
                    <div className="navbar-avatar">{user ? getInitials(user.name) : 'U'}</div>
                    <div className="navbar-user-details">
                        <h4>{user?.name || 'User'}</h4>
                        <p>{user?.email || ''}</p>
                    </div>
                </div>
                <button onClick={logout} className="logout-btn">
                    Sign Out
                </button>
            </div>
        </nav>
    )
}

export default Navbar
