import React, { useState, useEffect } from 'react';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';

const buttonStyle = {
    marginTop: '2rem',
    background: '#1976d2',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    padding: '12px 40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
    transition: 'background 0.2s',
};

const buttonHoverStyle = {
    background: '#1251a3',
};

const Query = () => {
    const [description, setDescription] = useState('');
    const [createdDate, setCreatedDate] = useState(new Date().toISOString().slice(0, 10));
    const [status, setStatus] = useState('');
    const [resolution, setResolution] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [queries, setQueries] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [note, setNote] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);
    const [editNoteIndex, setEditNoteIndex] = useState(null);
    const [editNoteText, setEditNoteText] = useState('');
    const [clientId, setClientId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch('/api/queries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client: clientId,
                    description, createdDate, status, resolution
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Submitted successfully!');
                setClientId('');
                setDescription('');
                setCreatedDate(new Date().toISOString().slice(0, 10));
                setStatus('');
                setResolution('');
            } else {
                setMessage(data.error || 'Submission failed.');
            }
        } catch (error) {
            setMessage('Network error.');
        } finally {
            setLoading(false);
        }
    };

    const handleAIHelp = async () => {
        setAiLoading(true);
        setAiResponse('');
        try {
            const response = await fetch('/api/queries/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: description }),
            });
            const data = await response.json();
            if (response.ok) {
                setAiResponse(data.aiResponse);
            } else {
                setAiResponse(data.error || 'AI request failed.');
            }
        } catch (error) {
            setAiResponse('Network error.');
        } finally {
            setAiLoading(false);
        }
    };

    // Fetch all queries for table
    React.useEffect(() => {
        const fetchQueries = async () => {
            setTableLoading(true);
            try {
                const res = await fetch('/api/queries');
                const data = await res.json();
                setQueries(data.data || []);
            } catch (e) {
                setQueries([]);
            } finally {
                setTableLoading(false);
            }
        };
        fetchQueries();
    }, [message]); // refetch on submit

    // Show details when customer name is clicked
    const handleShowDetails = (query) => {
        setSelectedQuery(query);
        setEditNoteIndex(null);
        setEditNoteText('');
    };

    // Add note to query
    const handleAddNote = async () => {
        if (!note.trim() || !selectedQuery) return;
        setNoteLoading(true);
        try {
            const res = await fetch(`/api/queries/${selectedQuery._id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: note })
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedQuery(data);
                setNote('');
            }
        } finally {
            setNoteLoading(false);
        }
    };

    // Edit note
    const handleEditNote = (idx, text) => {
        setEditNoteIndex(idx);
        setEditNoteText(text);
    };
    const handleSaveEditNote = async (idx) => {
        if (!selectedQuery) return;
        const noteId = selectedQuery.notes[idx]._id;
        try {
            const res = await fetch(`/api/queries/${selectedQuery._id}/notes/${noteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: editNoteText })
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedQuery(data);
                setEditNoteIndex(null);
                setEditNoteText('');
            }
        } catch { }
    };

    // Delete note
    const handleDeleteNote = async (idx) => {
        if (!selectedQuery) return;
        const noteId = selectedQuery.notes[idx]._id;
        try {
            const res = await fetch(`/api/queries/${selectedQuery._id}/notes/${noteId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                setSelectedQuery(data);
                setQueries(prev => prev.map(q => q._id === data._id ? data : q));
                // Reset edit state if the deleted note was being edited
                if (editNoteIndex === idx) {
                    setEditNoteIndex(null);
                    setEditNoteText('');
                }
            } else {
                setMessage(data.error || 'Failed to delete note.');
            }
        } catch (error) {
            setMessage('Network error while deleting note.');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '2rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '10px' }}>
                <div style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="client" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Customer Name</label>
                    <AutoCompleteAsync
                        entity={'client'}
                        displayLabels={['name']}
                        searchFields={'name'}
                        redirectLabel={'Add New Client'}
                        withRedirect
                        urlToRedirect={'/customer'}
                        value={clientId}
                        onChange={setClientId}
                    />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description</label>
                    <input
                        id="description"
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="createdDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Created Date</label>
                    <input
                        id="createdDate"
                        type="date"
                        value={createdDate}
                        onChange={e => setCreatedDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status</label>
                    <select
                        id="status"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                        <option value="">Select</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                    <label htmlFor="resolution" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Resolution</label>
                    <input
                        id="resolution"
                        type="text"
                        value={resolution}
                        onChange={e => setResolution(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            ...(isHovered ? buttonHoverStyle : {}),
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>

                {message && (
                    <div style={{ marginTop: '1rem', textAlign: 'center', color: message.includes('success') ? 'green' : 'red' }}>
                        {message}
                    </div>
                )}

              
              
            </form>

            {/* Table of queries */}
            <div style={{ maxWidth: 900, margin: '2rem auto', padding: '1.5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>All Queries</h2>
                {tableLoading ? (
                    <div style={{ textAlign: 'center' }}>Loading...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Description</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Created Date</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Resolution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queries.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No queries found.</td></tr>
                            ) : (
                                queries.map((q, idx) => [
                                    <tr key={q._id}>
                                        <td style={{ border: '1px solid #e0e6ed', padding: '8px', color: '#1565c0', cursor: 'pointer', fontWeight: 600, background: selectedQuery && selectedQuery._id === q._id ? '#e3f2fd' : '#fff', borderLeft: selectedQuery && selectedQuery._id === q._id ? '4px solid #1976d2' : '1px solid #e0e6ed' }} onClick={() => handleShowDetails(q)}>{q.clientName || (q.client && q.client.name) || ''}</td>
                                        <td style={{ border: '1px solid #e0e6ed', padding: '8px', background: selectedQuery && selectedQuery._id === q._id ? '#e3f2fd' : '#fff' }}>{q.description}</td>
                                        <td style={{ border: '1px solid #e0e6ed', padding: '8px', background: selectedQuery && selectedQuery._id === q._id ? '#e3f2fd' : '#fff' }}>{q.createdDate ? q.createdDate.slice(0,10) : ''}</td>
                                        <td style={{ border: '1px solid #e0e6ed', padding: '8px', background: selectedQuery && selectedQuery._id === q._id ? '#e3f2fd' : '#fff' }}>{q.status}</td>
                                        <td style={{ border: '1px solid #e0e6ed', padding: '8px', background: selectedQuery && selectedQuery._id === q._id ? '#e3f2fd' : '#fff' }}>{q.resolution}</td>
                                    </tr>,
                                    selectedQuery && selectedQuery._id === q._id && (
                                        <tr key={q._id + '-details'}>
                                            <td colSpan="5" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                                                <div style={{
                                                    margin: '0 auto',
                                                    marginTop: 8,
                                                    marginBottom: 8,
                                                    maxWidth: 900,
                                                    boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)',
                                                    borderRadius: 16,
                                                    background: 'linear-gradient(120deg, #f7fafd 60%, #e3f2fd 100%)',
                                                    border: '1.5px solid #1976d2',
                                                    padding: '2.2rem 2.8rem',
                                                    display: 'flex',
                                                    gap: '2.5rem',
                                                    alignItems: 'flex-start',
                                                    position: 'relative',
                                                    zIndex: 2
                                                }}>
                                                    <div style={{ flex: 1, minWidth: 220 }}>
                                                        <h3 style={{ marginTop: 0, color: '#1976d2', fontWeight: 700, marginBottom: 18, letterSpacing: 0.5 }}>Customer Details</h3>
                                                        <div style={{ lineHeight: 1.8, color: '#222', fontSize: 16 }}>
                                                            <div><b>Name:</b> {selectedQuery.clientName || (selectedQuery.client && selectedQuery.client.name) || ''}</div>
                                                            <div><b>Description:</b> {selectedQuery.description}</div>
                                                            <div><b>Created Date:</b> {selectedQuery.createdDate ? selectedQuery.createdDate.slice(0,10) : ''}</div>
                                                            <div><b>Status:</b> {selectedQuery.status}</div>
                                                            <div><b>Resolution:</b> {selectedQuery.resolution}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 2, minWidth: 280 }}>
                                                        <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 10, fontSize: 17 }}>Any Queries (Notes):</div>
                                                        <div>
                                                            {selectedQuery.notes && selectedQuery.notes.length > 0 ? selectedQuery.notes.map((n, i) => (
                                                                <div key={n._id || i} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e3eaf1', padding: '9px 16px' }}>
                                                                    {editNoteIndex === i ? (
                                                                        <>
                                                                            <input value={editNoteText} onChange={e => setEditNoteText(e.target.value)} style={{ width: '60%', fontSize: 15, padding: '6px 10px', borderRadius: 5, border: '1px solid #b0bec5' }} />
                                                                            <button onClick={() => handleSaveEditNote(i)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} title="Save">💾</button>
                                                                            <button onClick={() => setEditNoteIndex(null)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} title="Cancel">✖️</button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span style={{ flex: 1, color: '#333', fontSize: 15 }}>{n.text} <span style={{ color: '#90a4ae', fontSize: 13, marginLeft: 8 }}>{n.createdAt ? n.createdAt.slice(0,10) : ''}</span></span>
                                                                            <button onClick={() => handleEditNote(i, n.text)} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#1976d2' }} title="Edit">✏️</button>
                                                                            <button onClick={() => handleDeleteNote(i)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', fontSize: 18 }} title="Delete">🗑️</button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )) : <div style={{ color: '#b0bec5', fontStyle: 'italic', padding: '8px 0' }}>No queries yet.</div>}
                                                        </div>
                                                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
                                                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder={`Write the Queries for ${selectedQuery?.clientName || (selectedQuery?.client && selectedQuery.client.name) || 'Customer'}...`} style={{ width: '70%', marginRight: 12, fontSize: 15, padding: '8px 12px', borderRadius: 6, border: '1px solid #b0bec5' }} />
                                                            <button onClick={handleAddNote} disabled={noteLoading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, fontSize: 15, cursor: noteLoading ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #e3eaf1' }}>{noteLoading ? 'Adding...' : 'Add Query'}</button>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSelectedQuery(null)} style={{ position: 'absolute', top: 18, right: 18, background: '#e3eaf1', color: '#1976d2', border: 'none', borderRadius: '50%', width: 36, height: 36, fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf1' }} title="Close">×</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ])
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            
        </>
    );
};

export default Query;
