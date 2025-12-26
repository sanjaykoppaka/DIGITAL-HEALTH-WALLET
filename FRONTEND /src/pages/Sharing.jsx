import { useState, useEffect } from 'react'
import axios from 'axios'

function Sharing() {
    const [activeTab, setActiveTab] = useState('my-shares')
    const [myShares, setMyShares] = useState([])
    const [sharedWithMe, setSharedWithMe] = useState([])
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [showShareModal, setShowShareModal] = useState(false)

    // Share form state
    const [shareForm, setShareForm] = useState({
        report_id: '',
        shared_with_email: ''
    })
    const [sharing, setSharing] = useState(false)
    const [shareError, setShareError] = useState('')
    const [shareSuccess, setShareSuccess] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [mySharesRes, sharedWithMeRes, reportsRes] = await Promise.all([
                axios.get('/share/my-shares'),
                axios.get('/share/shared-with-me'),
                axios.get('/reports')
            ])
            setMyShares(mySharesRes.data)
            setSharedWithMe(sharedWithMeRes.data)
            setReports(reportsRes.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleShare = async (e) => {
        e.preventDefault()
        setShareError('')
        setShareSuccess('')
        setSharing(true)

        try {
            await axios.post('/share', shareForm)
            setShareSuccess('Report shared successfully!')
            setShareForm({ report_id: '', shared_with_email: '' })
            fetchData()
            setTimeout(() => {
                setShowShareModal(false)
                setShareSuccess('')
            }, 1500)
        } catch (error) {
            setShareError(error.response?.data?.error || 'Failed to share report')
        } finally {
            setSharing(false)
        }
    }

    const handleRevoke = async (id) => {
        if (!window.confirm('Are you sure you want to revoke access?')) return

        try {
            await axios.delete(`/share/${id}`)
            fetchData()
        } catch (error) {
            console.error('Revoke failed:', error)
        }
    }

    const handleDownload = async (report) => {
        try {
            const response = await axios.get(`/reports/${report.id}/download`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', report.file_name)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <div className="loading-inline">
                <div className="loader"></div>
            </div>
        )
    }

    return (
        <div className="sharing-page">
            <div className="page-header">
                <h1>Access Sharing</h1>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowShareModal(true)}>
                        + Share Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'my-shares' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-shares')}
                >
                    My Shared Reports ({myShares.length})
                </button>
                <button
                    className={`tab ${activeTab === 'shared-with-me' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shared-with-me')}
                >
                    Shared With Me ({sharedWithMe.length})
                </button>
            </div>

            {/* My Shares Tab */}
            {activeTab === 'my-shares' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Reports You've Shared</h3>
                    </div>
                    {myShares.length > 0 ? (
                        <div className="share-list">
                            {myShares.map(share => (
                                <div key={share.id} className="share-item">
                                    <div className="share-avatar">{getInitials(share.shared_with_name)}</div>
                                    <div className="share-info">
                                        <div className="share-name">{share.shared_with_name}</div>
                                        <div className="share-email">{share.shared_with_email}</div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontWeight: 500 }}>{share.report_title}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{share.report_type}</div>
                                    </div>
                                    <span className="share-badge">{share.access_type}</span>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleRevoke(share.id)}
                                    >
                                        Revoke
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔗</div>
                            <h3>No Shared Reports</h3>
                            <p>Share your medical reports with doctors, family, or friends</p>
                            <button className="btn btn-primary" onClick={() => setShowShareModal(true)}>
                                Share a Report
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Shared With Me Tab */}
            {activeTab === 'shared-with-me' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Reports Shared With You</h3>
                    </div>
                    {sharedWithMe.length > 0 ? (
                        <div className="report-list">
                            {sharedWithMe.map(report => (
                                <div key={report.id} className="report-item">
                                    <div className="report-icon">📄</div>
                                    <div className="report-info">
                                        <div className="report-title">{report.title}</div>
                                        <div className="report-meta">
                                            <span>{report.report_type}</span>
                                            <span>{new Date(report.report_date).toLocaleDateString()}</span>
                                            <span>by {report.owner_name}</span>
                                        </div>
                                    </div>
                                    <span className="share-badge">{report.access_type}</span>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleDownload(report)}
                                    >
                                        ⬇️ Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3>No Reports Shared With You</h3>
                            <p>When someone shares a report with you, it will appear here</p>
                        </div>
                    )}
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Share Report</h2>
                            <button className="modal-close" onClick={() => setShowShareModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleShare}>
                            <div className="modal-body">
                                {shareError && <div className="error-message">{shareError}</div>}
                                {shareSuccess && (
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        color: '#10b981',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        textAlign: 'center'
                                    }}>
                                        {shareSuccess}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Select Report</label>
                                    <select
                                        value={shareForm.report_id}
                                        onChange={(e) => setShareForm(prev => ({ ...prev, report_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">Choose a report...</option>
                                        {reports.map(report => (
                                            <option key={report.id} value={report.id}>
                                                {report.title} ({report.report_type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Recipient's Email</label>
                                    <input
                                        type="email"
                                        value={shareForm.shared_with_email}
                                        onChange={(e) => setShareForm(prev => ({ ...prev, shared_with_email: e.target.value }))}
                                        placeholder="doctor@example.com"
                                        required
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        The recipient must have an account to access shared reports
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={sharing}>
                                    {sharing ? 'Sharing...' : 'Share Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sharing
