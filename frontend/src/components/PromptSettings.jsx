
import React, { useState, useEffect } from 'react';
import { Save, FileJson, FileText, AlertTriangle, MessageSquare } from 'lucide-react';
import './ProjectSettingsModal.css'; // Re-use styles for now

const PromptSettings = ({ currentPrompt, onSavePrompt }) => {
    // Prompt State
    const [promptMode, setPromptMode] = useState('json'); // 'json' or 'text'
    const [jsonContent, setJsonContent] = useState('');
    const [textContent, setTextContent] = useState('');
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Initialize content based on currentPrompt
        try {
            const parsed = JSON.parse(currentPrompt || '{}');
            setJsonContent(JSON.stringify(parsed, null, 2));
        } catch (e) {
            setJsonContent(JSON.stringify({ role: currentPrompt || '' }, null, 2));
        }
    }, [currentPrompt]);

    const handleSavePrompt = async () => {
        setError(null);
        setSaving(true);
        try {
            let payload = {};
            
            if (promptMode === 'json') {
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

            await onSavePrompt(payload);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="prompt-editor-section">
            <div className="prompt-sub-tabs">
                <button 
                    onClick={() => setPromptMode('json')}
                    className={`prompt-sub-tab ${promptMode === 'json' ? 'active' : ''}`}
                >
                    <FileJson size={14} /> Advanced JSON
                </button>
                <button 
                    onClick={() => setPromptMode('text')}
                    className={`prompt-sub-tab ${promptMode === 'text' ? 'active' : ''}`}
                >
                    <FileText size={14} /> Quick Specification
                </button>
            </div>

            {promptMode === 'json' && (
                <div className="prompt-input-wrapper">
                    <p className="prompt-desc">
                        Edit the full system prompt JSON structure.
                    </p>
                    <textarea
                        value={jsonContent}
                        onChange={(e) => setJsonContent(e.target.value)}
                        className="settings-textarea json"
                    />
                </div>
            )}

            {promptMode === 'text' && (
                <div className="prompt-input-wrapper">
                        <p className="prompt-desc">
                        Append a new instruction to the existing prompt.
                    </p>
                    <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="e.g. You are a helpful assistant..."
                        className="settings-textarea text"
                    />
                </div>
            )}

            {error && (
                <div className="settings-error">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}
            
            <div className="settings-actions">
                    <button 
                    onClick={handleSavePrompt}
                    disabled={saving}
                    className="settings-save-btn"
                >
                    {saving ? 'Saving...' : <><Save size={16} /> Save Prompt</>}
                </button>
            </div>
        </div>
    );
};

export default PromptSettings;
