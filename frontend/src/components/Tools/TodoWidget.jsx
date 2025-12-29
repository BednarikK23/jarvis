import React, { useState, useEffect } from 'react';
import { Check, Trash2, Plus, Loader } from 'lucide-react';

const TodoWidget = () => {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const res = await fetch('/api/tools/todos');
            if (res.ok) {
                const data = await res.json();
                setTodos(data);
            }
        } catch (error) {
            console.error("Failed to fetch todos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        try {
            const res = await fetch('/api/tools/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newTodo })
            });
            if (res.ok) {
                const todo = await res.json();
                setTodos([...todos, todo]);
                setNewTodo("");
            }
        } catch (error) {
            console.error("Failed to add todo", error);
        }
    };

    const handleToggle = async (id, completed) => {
        try {
            const res = await fetch(`/api/tools/todos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !completed })
            });
            if (res.ok) {
                setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
            }
        } catch (error) {
            console.error("Failed to toggle todo", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/tools/todos/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setTodos(todos.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete todo", error);
        }
    };

    if (loading) return <div className="tools-loading"><Loader className="spin" size={20}/></div>;

    return (
        <div className="todo-widget">
            <h3>To-Do List</h3>
            <form onSubmit={handleAdd} className="todo-form">
                <input 
                    type="text" 
                    value={newTodo} 
                    onChange={(e) => setNewTodo(e.target.value)} 
                    placeholder="Add task..." 
                />
                <button type="submit"><Plus size={16} /></button>
            </form>
            <ul className="todo-list">
                {todos.map(todo => (
                    <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                        <span onClick={() => handleToggle(todo.id, todo.completed)} className="todo-text">
                            {todo.completed && <Check size={14} className="check-icon" />}
                            {todo.text}
                        </span>
                        <button onClick={() => handleDelete(todo.id)} className="delete-btn">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
                {todos.length === 0 && <li className="empty-todo">No tasks yet</li>}
            </ul>
        </div>
    );
};

export default TodoWidget;
