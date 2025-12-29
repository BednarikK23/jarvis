import React, { useState, useEffect } from 'react';
import './Tools.css';

const CalendarEventForm = ({ event, onSubmit, onCancel, submitLabel = "Add" }) => {
    const [formData, setFormData] = useState({
        title: "",
        start: "",
        end: "",
        description: "",
        color: "#3b82f6"
    });

    const COLORS = [
        "#3b82f6", // Blue (Default)
        "#ef4444", // Red
        "#10b981", // Green
        "#f59e0b", // Yellow
        "#8b5cf6", // Purple
        "#ec4899", // Pink
    ];

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || "",
                start: event.start || "",
                end: event.end || "",
                description: event.description || "",
                color: event.color || "#3b82f6"
            });
        }
    }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="event-form">
            <input 
                name="title"
                type="text" 
                placeholder="Event Title" 
                required
                value={formData.title}
                onChange={handleChange}
            />
            <div className="date-inputs">
                <input 
                    name="start"
                    type="datetime-local" 
                    required
                    value={formData.start}
                    onChange={handleChange}
                />
                <input 
                    name="end"
                    type="datetime-local" 
                    required
                    value={formData.end}
                    onChange={handleChange}
                />
            </div>
            <textarea 
                name="description"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={handleChange}
            />
            
            <div className="color-picker">
                {COLORS.map(c => (
                    <button
                        key={c}
                        type="button"
                        className={`color-btn ${formData.color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                    />
                ))}
            </div>

            <div className="form-actions">
                <button type="button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="primary">{submitLabel}</button>
            </div>
        </form>
    );
};

export default CalendarEventForm;
