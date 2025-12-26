import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useAuth } from '../context/AuthContext'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalReports: 0,
        totalVitals: 0,
        sharedReports: 0,
        recentReports: []
    })
    const [vitalsTrends, setVitalsTrends] = useState([])
    const [latestVitals, setLatestVitals] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [reportsRes, vitalsRes, trendsRes, latestRes, sharesRes] = await Promise.all([
                axios.get('/reports'),
                axios.get('/vitals'),
                axios.get('/vitals/trends'),
                axios.get('/vitals/latest'),
                axios.get('/share/my-shares')
            ])

            setStats({
                totalReports: reportsRes.data.length,
                totalVitals: vitalsRes.data.length,
                sharedReports: sharesRes.data.length,
                recentReports: reportsRes.data.slice(0, 5)
            })
            setVitalsTrends(trendsRes.data)
            setLatestVitals(latestRes.data)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getChartData = () => {
        if (vitalsTrends.length === 0) return null

        const colors = [
            { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
            { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
            { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
        ]

        const datasets = vitalsTrends.slice(0, 4).map((trend, index) => ({
            label: `${trend.type} (${trend.unit})`,
            data: trend.data.map(d => d.value),
            borderColor: colors[index].border,
            backgroundColor: colors[index].bg,
            fill: true,
            tension: 0.4
        }))

        const labels = vitalsTrends[0]?.data.map(d =>
            new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ) || []

        return { labels, datasets }
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#a1a1aa',
                    usePointStyle: true
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#71717a' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#71717a' }
            }
        }
    }

    const getVitalIcon = (type) => {
        const icons = {
            'Blood Pressure': '🩸',
            'Heart Rate': '❤️',
            'Blood Sugar': '🍬',
            'Weight': '⚖️',
            'Temperature': '🌡️',
            'Oxygen Level': '💨'
        }
        return icons[type] || '📊'
    }

    if (loading) {
        return (
            <div className="loading-inline">
                <div className="loader"></div>
            </div>
        )
    }

    const chartData = getChartData()

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1>Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">📄</div>
                    <div className="stat-content">
                        <h3>{stats.totalReports}</h3>
                        <p>Total Reports</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon secondary">❤️</div>
                    <div className="stat-content">
                        <h3>{stats.totalVitals}</h3>
                        <p>Vital Readings</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon accent">🔗</div>
                    <div className="stat-content">
                        <h3>{stats.sharedReports}</h3>
                        <p>Shared Reports</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon danger">📈</div>
                    <div className="stat-content">
                        <h3>{latestVitals.length}</h3>
                        <p>Tracked Vitals</p>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* Vitals Chart */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3 className="chart-title">Vitals Trends</h3>
                        <Link to="/vitals" className="btn btn-sm btn-secondary">View All</Link>
                    </div>
                    <div style={{ height: '300px' }}>
                        {chartData ? (
                            <Line data={chartData} options={chartOptions} />
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <h3>No Vitals Data</h3>
                                <p>Start tracking your vitals to see trends</p>
                                <Link to="/vitals" className="btn btn-primary btn-sm">Add Vitals</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Latest Vitals */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Latest Vitals</h3>
                        <Link to="/vitals" className="btn btn-sm btn-secondary">View All</Link>
                    </div>
                    {latestVitals.length > 0 ? (
                        <div className="vitals-list">
                            {latestVitals.map(vital => (
                                <div key={vital.id} className="share-item">
                                    <div className="share-avatar">{getVitalIcon(vital.vital_type)}</div>
                                    <div className="share-info">
                                        <div className="share-name">{vital.vital_type}</div>
                                        <div className="share-email">
                                            {new Date(vital.recorded_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="vital-value">
                                        <strong>{vital.value}</strong> {vital.unit}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No vitals recorded yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Reports */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Recent Reports</h3>
                    <Link to="/reports" className="btn btn-sm btn-secondary">View All</Link>
                </div>
                {stats.recentReports.length > 0 ? (
                    <div className="report-list">
                        {stats.recentReports.map(report => (
                            <div key={report.id} className="report-item">
                                <div className="report-icon">📄</div>
                                <div className="report-info">
                                    <div className="report-title">{report.title}</div>
                                    <div className="report-meta">
                                        <span>{report.report_type}</span>
                                        <span>{new Date(report.report_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <h3>No Reports Yet</h3>
                        <p>Upload your first medical report to get started</p>
                        <Link to="/reports" className="btn btn-primary btn-sm">Upload Report</Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
