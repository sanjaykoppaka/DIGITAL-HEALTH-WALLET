import { useState, useEffect } from 'react'
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

function Vitals() {
    const [vitals, setVitals] = useState([])
    const [trends, setTrends] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedType, setSelectedType] = useState('')
    const [filters, setFilters] = useState({
        vital_type: '',
        start_date: '',
        end_date: ''
    })

    // Add form state
    const [addForm, setAddForm] = useState({
        vital_type: 'Blood Pressure',
        value: '',
        unit: 'mmHg',
        recorded_at: new Date().toISOString().slice(0, 16),
        notes: ''
    })
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState('')

    const vitalTypes = [
        { type: 'Blood Pressure', unit: 'mmHg', icon: '🩸' },
        { type: 'Heart Rate', unit: 'bpm', icon: '❤️' },
        { type: 'Blood Sugar', unit: 'mg/dL', icon: '🍬' },
        { type: 'Weight', unit: 'kg', icon: '⚖️' },
        { type: 'Temperature', unit: '°C', icon: '🌡️' },
        { type: 'Oxygen Level', unit: '%', icon: '💨' }
    ]

    useEffect(() => {
        fetchVitals()
        fetchTrends()
    }, [filters])

    const fetchVitals = async () => {
        try {
            const params = new URLSearchParams()
            if (filters.vital_type) params.append('vital_type', filters.vital_type)
            if (filters.start_date) params.append('start_date', filters.start_date)
            if (filters.end_date) params.append('end_date', filters.end_date)

            const response = await axios.get(`/vitals?${params.toString()}`)
            setVitals(response.data)
        } catch (error) {
            console.error('Error fetching vitals:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTrends = async () => {
        try {
            const params = new URLSearchParams()
            if (filters.start_date) params.append('start_date', filters.start_date)
            if (filters.end_date) params.append('end_date', filters.end_date)

            const response = await axios.get(`/vitals/trends?${params.toString()}`)
            setTrends(response.data)
        } catch (error) {
            console.error('Error fetching trends:', error)
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        setAddError('')
        setAdding(true)

        try {
            await axios.post('/vitals', addForm)
            setShowAddModal(false)
            setAddForm({
                vital_type: 'Blood Pressure',
                value: '',
                unit: 'mmHg',
                recorded_at: new Date().toISOString().slice(0, 16),
                notes: ''
            })
            fetchVitals()
            fetchTrends()
        } catch (error) {
            setAddError(error.response?.data?.error || 'Failed to add vital')
        } finally {
            setAdding(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vital?')) return

        try {
            await axios.delete(`/vitals/${id}`)
            fetchVitals()
            fetchTrends()
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    const handleTypeChange = (type) => {
        const vitalType = vitalTypes.find(v => v.type === type)
        setAddForm(prev => ({
            ...prev,
            vital_type: type,
            unit: vitalType?.unit || ''
        }))
    }

    const getChartData = (type) => {
        const trend = trends.find(t => t.type === type)
        if (!trend) return null

        return {
            labels: trend.data.map(d =>
                new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            ),
            datasets: [{
                label: `${trend.type} (${trend.unit})`,
                data: trend.data.map(d => d.value),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }]
        }
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
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
        return vitalTypes.find(v => v.type === type)?.icon || '📊'
    }

    if (loading) {
        return (
            <div className="loading-inline">
                <div className="loader"></div>
            </div>
        )
    }

    return (
        <div className="vitals-page">
            <div className="page-header">
                <h1>Vitals Tracking</h1>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Vital
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Vital Type</label>
                    <select
                        value={filters.vital_type}
                        onChange={(e) => setFilters(prev => ({ ...prev, vital_type: e.target.value }))}
                    >
                        <option value="">All Types</option>
                        {vitalTypes.map(v => (
                            <option key={v.type} value={v.type}>{v.type}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>From</label>
                    <input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                </div>
                <div className="filter-group">
                    <label>To</label>
                    <input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                </div>
            </div>

            {/* Vitals Charts */}
            {trends.length > 0 && (
                <div className="grid-2" style={{ marginBottom: '2rem' }}>
                    {trends.map(trend => (
                        <div key={trend.type} className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title">{getVitalIcon(trend.type)} {trend.type}</h3>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Latest: {trend.data[trend.data.length - 1]?.value} {trend.unit}
                                </span>
                            </div>
                            <div style={{ height: '200px' }}>
                                <Line data={getChartData(trend.type)} options={chartOptions} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vitals Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Readings</h3>
                </div>
                {vitals.length > 0 ? (
                    <table className="vitals-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Date & Time</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vitals.map(vital => (
                                <tr key={vital.id}>
                                    <td>
                                        <span className="vital-type-badge">
                                            {getVitalIcon(vital.vital_type)} {vital.vital_type}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{vital.value}</strong> {vital.unit}
                                    </td>
                                    <td>{new Date(vital.recorded_at).toLocaleString()}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{vital.notes || '-'}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(vital.id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">❤️</div>
                        <h3>No Vitals Recorded</h3>
                        <p>Start tracking your vitals to monitor your health</p>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            Add Vital
                        </button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Vital Reading</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-body">
                                {addError && <div className="error-message">{addError}</div>}

                                <div className="form-group">
                                    <label>Vital Type</label>
                                    <select
                                        value={addForm.vital_type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        required
                                    >
                                        {vitalTypes.map(v => (
                                            <option key={v.type} value={v.type}>{v.icon} {v.type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Value</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            step="any"
                                            value={addForm.value}
                                            onChange={(e) => setAddForm(prev => ({ ...prev, value: e.target.value }))}
                                            placeholder="Enter value"
                                            required
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="text"
                                            value={addForm.unit}
                                            onChange={(e) => setAddForm(prev => ({ ...prev, unit: e.target.value }))}
                                            style={{ width: '80px' }}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={addForm.recorded_at}
                                        onChange={(e) => setAddForm(prev => ({ ...prev, recorded_at: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Notes (optional)</label>
                                    <textarea
                                        value={addForm.notes}
                                        onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add any notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={adding}>
                                    {adding ? 'Adding...' : 'Add Vital'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vitals
