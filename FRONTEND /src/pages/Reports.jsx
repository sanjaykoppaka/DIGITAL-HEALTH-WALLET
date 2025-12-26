import { useState, useEffect } from 'react'
import axios from 'axios'

function Reports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [filters, setFilters] = useState({
        report_type: '',
        start_date: '',
        end_date: '',
        search: ''
    })

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        title: '',
        report_type: 'Blood Test',
        report_date: new Date().toISOString().split('T')[0],
        notes: '',
        file: null
    })
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')

    const reportTypes = [
        'Blood Test',
        'X-Ray',
        'MRI',
        'CT Scan',
        'Ultrasound',
        'ECG',
        'Prescription',
        'Lab Report',
        'Other'
    ]

    useEffect(() => {
        fetchReports()
    }, [filters])

    const fetchReports = async () => {
        try {
            const params = new URLSearchParams()
            if (filters.report_type) params.append('report_type', filters.report_type)
            if (filters.start_date) params.append('start_date', filters.start_date)
            if (filters.end_date) params.append('end_date', filters.end_date)
            if (filters.search) params.append('search', filters.search)

            const response = await axios.get(`/reports?${params.toString()}`)
            setReports(response.data)
        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        setUploadError('')
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', uploadForm.file)
            formData.append('title', uploadForm.title)
            formData.append('report_type', uploadForm.report_type)
            formData.append('report_date', uploadForm.report_date)
            formData.append('notes', uploadForm.notes)

            await axios.post('/reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setShowUploadModal(false)
            setUploadForm({
                title: '',
                report_type: 'Blood Test',
                report_date: new Date().toISOString().split('T')[0],
                notes: '',
                file: null
            })
            fetchReports()
        } catch (error) {
            setUploadError(error.response?.data?.error || 'Upload failed')
        } finally {
            setUploading(false)
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return

        try {
            await axios.delete(`/reports/${id}`)
            fetchReports()
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setUploadForm(prev => ({ ...prev, file }))
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) {
            setUploadForm(prev => ({ ...prev, file }))
        }
    }

    const getReportIcon = (type) => {
        const icons = {
            'Blood Test': '🩸',
            'X-Ray': '🦴',
            'MRI': '🧠',
            'CT Scan': '📷',
            'Ultrasound': '🔊',
            'ECG': '💓',
            'Prescription': '💊',
            'Lab Report': '🔬'
        }
        return icons[type] || '📄'
    }

    if (loading) {
        return (
            <div className="loading-inline">
                <div className="loader"></div>
            </div>
        )
    }

    return (
        <div className="reports-page">
            <div className="page-header">
                <h1>Medical Reports</h1>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                        + Upload Report
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Search</label>
                    <input
                        type="text"
                        placeholder="Search reports..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <div className="filter-group">
                    <label>Type</label>
                    <select
                        value={filters.report_type}
                        onChange={(e) => setFilters(prev => ({ ...prev, report_type: e.target.value }))}
                    >
                        <option value="">All Types</option>
                        {reportTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
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

            {/* Reports List */}
            {reports.length > 0 ? (
                <div className="report-list">
                    {reports.map(report => (
                        <div key={report.id} className="report-item">
                            <div className="report-icon">{getReportIcon(report.report_type)}</div>
                            <div className="report-info">
                                <div className="report-title">{report.title}</div>
                                <div className="report-meta">
                                    <span>{report.report_type}</span>
                                    <span>{new Date(report.report_date).toLocaleDateString()}</span>
                                    <span>{report.file_name}</span>
                                </div>
                                {report.notes && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{report.notes}</p>}
                            </div>
                            <div className="report-actions">
                                <button className="btn btn-sm btn-secondary" onClick={() => handleDownload(report)}>
                                    ⬇️ Download
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(report.id)}>
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <h3>No Reports Found</h3>
                    <p>Upload your first medical report to get started</p>
                    <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                        Upload Report
                    </button>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload Report</h2>
                            <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="modal-body">
                                {uploadError && <div className="error-message">{uploadError}</div>}

                                <div
                                    className={`file-upload ${uploadForm.file ? 'has-file' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => document.getElementById('file-input').click()}
                                >
                                    <input
                                        type="file"
                                        id="file-input"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    {uploadForm.file ? (
                                        <div className="file-preview">
                                            <div className="file-preview-icon">📎</div>
                                            <div className="file-preview-info">
                                                <div className="file-preview-name">{uploadForm.file.name}</div>
                                                <div className="file-preview-size">
                                                    {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="file-upload-icon">📤</div>
                                            <p>Drag & drop your file here, or <span className="highlight">browse</span></p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 10MB</p>
                                        </>
                                    )}
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Annual Blood Test Results"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Report Type</label>
                                    <select
                                        value={uploadForm.report_type}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, report_type: e.target.value }))}
                                        required
                                    >
                                        {reportTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Report Date</label>
                                    <input
                                        type="date"
                                        value={uploadForm.report_date}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, report_date: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Notes (optional)</label>
                                    <textarea
                                        value={uploadForm.notes}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add any notes about this report..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading || !uploadForm.file}>
                                    {uploading ? 'Uploading...' : 'Upload Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reports
