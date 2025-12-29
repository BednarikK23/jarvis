import React, { useState, useEffect } from 'react';
import { CloudRain, Loader, RefreshCw } from 'lucide-react';
import './WeatherWidget.css';

const WeatherWidget = () => {
    const [weather, setWeather] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeather();
    }, []);

    const fetchWeather = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tools/weather');
            if (res.ok) {
                const data = await res.json();
                setWeather(data.summary);
            }
        } catch (error) {
            console.error("Failed to fetch weather", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="weather-widget">
            <div className="weather-header">
                <h3><CloudRain size={16}/> Weather Forecast</h3>
                <button onClick={fetchWeather} className="refresh-btn" title="Refresh">
                    <RefreshCw size={14} className={loading ? "spin" : ""} />
                </button>
            </div>
            
            <div className="weather-content">
                {loading && !weather ? (
                    <div className="weather-loading"><Loader className="spin" size={16}/></div>
                ) : (
                   <div className="weather-text" dangerouslySetInnerHTML={{ __html: weather.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                )}
            </div>
        </div>
    );
};

export default WeatherWidget;
