import React, { useState, useEffect } from 'react';
import { FileText, Loader, Clock, ArrowRight } from 'lucide-react';
import './DigestWidget.css';

const formatDate = (dateString) => {
    try {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return '';
    }
};

const DigestWidget = ({ onOpenChat }) => {
    const [generating, setGenerating] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/tools/digest/history');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setHistory(data);
                } else {
                    console.error("Digest history is not an array:", data);
                    setHistory([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch digest history", error);
            setError("Failed to load history");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/tools/digest', {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                // Refresh history
                fetchHistory();
                // Open the new chat
                if (onOpenChat) {
                    onOpenChat(data.chat_id);
                }
            } else {
                console.error("Digest generation failed");
            }
        } catch (error) {
            console.error("Error generating digest", error);
        } finally {
            setGenerating(false);
        }
    };

    if (error) {
        // Fallback UI just in case
        return <div className="digest-widget error">⚠️ {error}</div>
    }

    return (
        <div className="digest-widget">
            <div className="digest-header">
                <h3>Daily Briefing</h3>
                <button 
                    className="generate-btn" 
                    onClick={handleGenerate} 
                    disabled={generating}
                >
                    {generating ? <Loader className="spin" size={16}/> : <FileText size={16}/>}
                    {generating ? 'Generating...' : 'New Digest'}
                </button>
            </div>
            
            <div className="digest-history">
                <h4>History</h4>
                {loadingHistory ? (
                    <div className="history-loading"><Loader className="spin" size={14}/></div>
                ) : (
                    <ul className="history-list">
                        {Array.isArray(history) && history.map(chat => (
                            <li key={chat.id} onClick={() => onOpenChat(chat.id)}>
                                <span className="history-date">
                                    <Clock size={12} />
                                    {formatDate(chat.created_at)}
                                </span>
                                <span className="history-title">
                                    {(chat.title || 'Untitled').replace('Digest: ', '')}
                                </span>
                                <ArrowRight size={12} className="arrow-icon"/>
                            </li>
                        ))}
                        {(!Array.isArray(history) || history.length === 0) && <li className="empty-history">No digests yet</li>}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DigestWidget;
