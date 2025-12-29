import React, { useState, useEffect } from 'react';
import { X, Save, FileJson, FileText, AlertTriangle } from 'lucide-react';

const PromptEditor = ({ projectId, currentPrompt, onClose, onSave }) => {
    const [mode, setMode] = useState('json'); // 'json' or 'text'
    const [jsonContent, setJsonContent] = useState('');
    const [textContent, setTextContent] = useState('');
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Initialize content based on currentPrompt
        // We try to parse it to show nicely in JSON mode
        try {
            const parsed = JSON.parse(currentPrompt || '{}');
            setJsonContent(JSON.stringify(parsed, null, 2));
        } catch (e) {
            setJsonContent(JSON.stringify({ role: currentPrompt || '' }, null, 2));
        }
    }, [currentPrompt]);

    const handleSave = async () => {
        setError(null);
        setSaving(true);
        try {
            let payload = {};
            
            if (mode === 'json') {
                // validate JSON
                try {
                    JSON.parse(jsonContent);
                } catch (e) {
                    throw new Error("Invalid JSON: " + e.message);
                }
                payload = { mode: 'json_merge', content: jsonContent };
            } else {
                if (!textContent.trim()) {
                     throw new Error("Please enter some text specification.");
                }
                payload = { mode: 'text_append', content: textContent };
            }

            await onSave(payload);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                width: '600px',
                maxWidth: '90%',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '80vh'
            }}>
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>Project Settings & Prompt</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1rem 1.5rem', flex: 1, overflowY: 'auto' }}>
                    
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <button 
                            onClick={() => setMode('json')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: mode === 'json' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: mode === 'json' ? 'var(--accent-color)' : 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <FileJson size={16} /> Advanced JSON
                        </button>
                        <button 
                            onClick={() => setMode('text')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: mode === 'text' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: mode === 'text' ? 'var(--accent-color)' : 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <FileText size={16} /> Quick Specification
                        </button>
                    </div>

                    {mode === 'json' && (
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Edit the full system prompt JSON structure. This gives you complete control over roles and attributes.
                            </p>
                            <textarea
                                value={jsonContent}
                                onChange={(e) => setJsonContent(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    )}

                    {mode === 'text' && (
                        <div>
                             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Append a new instruction or specification to the existing prompt. This will be added as "user_specification".
                            </p>
                            <textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="e.g. You are a helpful assistant who loves cats..."
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    fontFamily: 'inherit',
                                    fontSize: '0.95rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    )}

                    {error && (
                        <div style={{ 
                            marginTop: '1rem', 
                            padding: '0.75rem', 
                            background: 'rgba(255, 68, 68, 0.1)', 
                            border: '1px solid var(--error-color)', 
                            borderRadius: '4px',
                            color: 'var(--error-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                </div>

                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }}>
                    <button 
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--accent-color)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptEditor;
