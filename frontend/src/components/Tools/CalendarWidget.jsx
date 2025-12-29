import React, { useState, useEffect } from 'react';
import { Loader, Pencil, Trash2 } from 'lucide-react';
import CalendarEventForm from './CalendarEventForm';

const CalendarWidget = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newEvent, setNewEvent] = useState({
        title: "",
        start: "",
        end: "",
        description: "",
        color: "#3b82f6"
    });

    useEffect(() => {
        // Set default dates to today
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60*60*1000);
        setNewEvent(prev => ({
            ...prev,
            start: toLocalIsoString(now),
            end: toLocalIsoString(oneHourLater)
        }));
        fetchEvents();
    }, []);

    // Helper to format date for input[type="datetime-local"]
    // format: YYYY-MM-DDThh:mm
    const toLocalIsoString = (date) => {
        const pad = (num) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/tools/calendar');
            if (res.ok) {
                const data = await res.json();
                // Sort by date
                data.sort((a, b) => new Date(a.start) - new Date(b.start));
                setEvents(data);
            }
        } catch (error) {
            console.error("Failed to fetch calendar", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (formData) => {
        try {
            const payload = {
                ...formData,
                start: new Date(formData.start).toISOString(),
                end: new Date(formData.end).toISOString()
            };

            const url = editingId ? `/api/tools/calendar/${editingId}` : '/api/tools/calendar';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchEvents();
                resetForm();
            }
        } catch (err) {
            console.error("Failed to save event", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        try {
            const res = await fetch(`/api/tools/calendar/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setEvents(events.filter(e => e.id !== id));
                if (editingId === id) resetForm();
            }
        } catch (err) {
            console.error("Failed to delete event", err);
        }
    };

    const handleEdit = (event) => {
        setNewEvent({
            title: event.title,
            start: toLocalIsoString(new Date(event.start)),
            end: toLocalIsoString(new Date(event.end)),
            description: event.description || ""
        });
        setEditingId(event.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        // Reset to default
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60*60*1000);
        setNewEvent({
            title: "",
            start: toLocalIsoString(now),
            end: toLocalIsoString(oneHourLater),
            description: "",
            color: "#3b82f6"
        });
    };

    if (loading) return <div className="tools-loading"><Loader className="spin" size={20}/></div>;

    return (
        <div className="calendar-widget">
            <div className="calendar-header-row">
                <h3>Calendar (Week)</h3>
                <button 
                    className="add-event-btn"
                    onClick={() => {
                        if (showForm && editingId) {
                           // if switch from edit to add, just reset
                           resetForm();
                           setShowForm(true); 
                        } else {
                           if (showForm) resetForm();
                           else setShowForm(true);
                        }
                    }}
                    title="Add Event"
                >
                    +
                </button>
            </div>

            {showForm && (
                <CalendarEventForm 
                    event={newEvent} 
                    onSubmit={handleSubmit} 
                    onCancel={resetForm}
                    submitLabel={editingId ? 'Save' : 'Add'}
                />
            )}

            <div className="calendar-list">
                {events.map(event => {
                    const start = new Date(event.start);
                    const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeStr = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                        <div 
                            key={event.id} 
                            className="calendar-item"
                            style={{ borderLeft: `4px solid ${event.color || '#3b82f6'}` }}
                        >
                            <div className="cal-date">
                                <span>{dateStr}</span>
                                <small>{timeStr}</small>
                            </div>
                            <div className="cal-content">
                                <strong>{event.title}</strong>
                                {event.description && <p>{event.description}</p>}
                            </div>
                            <div className="event-actions">
                                <button className="event-action-btn" onClick={() => handleEdit(event)} title="Edit">
                                    <Pencil size={12} />
                                </button>
                                <button className="event-action-btn delete" onClick={() => handleDelete(event.id)} title="Delete">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {events.length === 0 && <p className="empty-cal">No upcoming events</p>}
            </div>
        </div>
    );
};

export default CalendarWidget;
