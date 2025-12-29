import React, { useState, useEffect } from 'react';
import { X, Save, FileJson, FileText, AlertTriangle } from 'lucide-react';

import './PromptEditor.css';

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
        <div className="prompt-editor-overlay">
            <div className="prompt-editor-modal">
                <div className="prompt-editor-header">
                    <h3 className="prompt-editor-title">Project Settings & Prompt</h3>
                    <button onClick={onClose} className="prompt-editor-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="prompt-editor-content">
                    
                    <div className="prompt-editor-tabs">
                        <button 
                            onClick={() => setMode('json')}
                            className={`prompt-editor-tab ${mode === 'json' ? 'active' : ''}`}
                        >
                            <FileJson size={16} /> Advanced JSON
                        </button>
                        <button 
                            onClick={() => setMode('text')}
                            className={`prompt-editor-tab ${mode === 'text' ? 'active' : ''}`}
                        >
                            <FileText size={16} /> Quick Specification
                        </button>
                    </div>

                    {mode === 'json' && (
                        <div>
                            <p className="prompt-editor-description">
                                Edit the full system prompt JSON structure. This gives you complete control over roles and attributes.
                            </p>
                            <textarea
                                value={jsonContent}
                                onChange={(e) => setJsonContent(e.target.value)}
                                className="prompt-editor-textarea json"
                            />
                        </div>
                    )}

                    {mode === 'text' && (
                        <div>
                             <p className="prompt-editor-description">
                                Append a new instruction or specification to the existing prompt. This will be added as "user_specification".
                            </p>
                            <textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="e.g. You are a helpful assistant who loves cats..."
                                className="prompt-editor-textarea text"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="prompt-editor-error">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                </div>

                <div className="prompt-editor-footer">
                    <button 
                        onClick={onClose}
                        disabled={saving}
                        className="prompt-editor-cancel-btn"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="prompt-editor-save-btn"
                    >
                        {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptEditor;
