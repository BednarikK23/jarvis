
import React, { useState, useEffect } from 'react';
import { FolderPlus, Trash2, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import './KnowledgeBase.css';

const KnowledgeBase = ({ projectId }) => {
    const [sources, setSources] = useState([]);
    const [newPath, setNewPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSources();
    }, [projectId]);

    const fetchSources = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/sources`);
            if (!res.ok) throw new Error("Failed to fetch sources");
            const data = await res.json();
            setSources(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSource = async () => {
        if (!newPath.trim()) {
            alert("Please enter a valid absolute path to a local folder.");
            return;
        }
        setLoading(true);
        setError(null);
        console.log("Adding source:", newPath, "for project:", projectId);
        
        try {
            const res = await fetch(`/api/projects/${projectId}/sources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: newPath.trim() })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to add source");
            }
            const source = await res.json();
            setSources([...sources, source]);
            setNewPath('');
        } catch (err) {
            console.error(err);
            setError(err.message);
            alert("Error adding source: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSource = async (id) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/sources/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete source");
            setSources(sources.filter(s => s.id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="knowledge-base">
            <div className="kb-add-section">
                <input 
                    type="text" 
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/absolute/path/to/your/folder"
                    className="kb-input"
                />
                <button onClick={handleAddSource} disabled={loading} className="kb-add-btn">
                    <FolderPlus size={16} /> Add Source
                </button>
            </div>

            {error && <div className="kb-error"><AlertCircle size={16}/> {error}</div>}

            <div className="kb-list">
                {sources.map(source => (
                    <div key={source.id} className="kb-item">
                        <div className="kb-item-info">
                            <span className="kb-path" title={source.path}>{source.path}</span>
                            <div className="kb-status">
                                {source.status === 'indexed' && <span className="status-indexed"><CheckCircle size={12}/> Indexed</span>}
                                {source.status === 'indexing' && <span className="status-indexing"><Loader size={12} className="spin"/> Indexing...</span>}
                                {source.status === 'pending' && <span className="status-pending">Pending</span>}
                                {source.status === 'error' && <span className="status-error">Error</span>}
                            </div>
                        </div>
                        <button onClick={() => handleDeleteSource(source.id)} className="kb-delete-btn">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {sources.length === 0 && !loading && (
                    <div className="kb-empty">No knowledge sources added yet.</div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;
