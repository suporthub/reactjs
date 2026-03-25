import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, MoreVertical, Clock } from 'lucide-react';
import './calendar.css';

export default function Calendar() {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const monthDropdownRef = useRef(null);
    const yearDropdownRef = useRef(null);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');

    const mockEvents = {
        [`${yearStr}-${monthStr}-02`]: { dots: ['purple', 'green', 'pink'] },
        [`${yearStr}-${monthStr}-10`]: { label: 'Analysis', amount: '+2.4%' },
        [`${yearStr}-${monthStr}-15`]: { avatars: [1, 2, 3], more: 7 },
        [`${yearStr}-${monthStr}-18`]: { label: 'NFP Data' },
        [`${yearStr}-${monthStr}-20`]: { dots: ['green', 'orange', 'purple'] },
        [`${yearStr}-${monthStr}-05`]: { isActive: true, dots: ['purple', 'green', 'orange'] },
        [`${yearStr}-${monthStr}-12`]: { isSpecialActive: true, avatars: [1, 2, 3], more: 7 }
    };

    const sideEvents = [
        { date: 'Nov 2th, 2020', title: 'Movie Night', time: '07:00 - 10:00 PM', price: '$5.0', tickets: '23 ticket left', progress: 65 },
        { date: 'Nov 6th, 2020', title: 'Color Run', time: '07:00 - 10:00 PM', price: '$0', tickets: '17 ticket left', progress: 40 },
        { date: 'Nov 2th, 2020', title: 'Hostage Situation', time: '07:00 - 10:00 PM', price: '$5.0', tickets: '4 ticket left', progress: 85 }
    ];

    useEffect(() => {
        function handleClickOutside(event) {
            if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) setShowMonthDropdown(false);
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) setShowYearDropdown(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; 
    };

    const daysInMonth = getDaysInMonth(viewDate.getMonth(), viewDate.getFullYear());
    const startDayOffset = getFirstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());

    const goToPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const goToNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const goToPrevYear = () => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    const goToNextYear = () => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));

    const handleMonthSelect = (index) => {
        setViewDate(new Date(viewDate.getFullYear(), index, 1));
        setShowMonthDropdown(false);
    };

    const handleYearSelect = (year) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setShowYearDropdown(false);
    };

    const renderDays = () => {
        const days = [];
        const currentYear = viewDate.getFullYear();
        const currentMonth = viewDate.getMonth();

        for (let i = 0; i < startDayOffset; i++) {
            days.push(<div key={`empty-${i}`} className="day-box empty"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const event = mockEvents[dateStr];
            days.push(
                <div key={`day-${i}`} className={`day-box ${event?.isActive ? 'active' : ''} ${event?.isSpecialActive ? 'alt-active' : ''}`}>
                    <span className="day-number">{i}</span>
                    <div className="day-content">
                        {event?.dots && <div className="event-dots">{event.dots.map((d, idx) => <div key={idx} className={`dot ${d}`}></div>)}</div>}
                        {event?.label && <div className="event-label">{event.label}</div>}
                    </div>
                </div>
            );
        }

        return days;
    };

    const years = [];
    for (let i = today.getFullYear() - 10; i <= today.getFullYear() + 10; i++) years.push(i);

    return (
        <div className="calendar-page-container">
            <div className="calendar-layout">
                {/* Left Side: Calendar (70%) */}
                <div className="calendar-main">
                    <div className="calendar-header">
                        <div className="header-left">
                            <div className="selector-group" ref={monthDropdownRef}>
                                <h2 onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
                                    {monthNames[viewDate.getMonth()]} <ChevronDown size={14} className={`chev ${showMonthDropdown ? 'rotate' : ''}`} />
                                </h2>
                                {showMonthDropdown && (
                                    <div className="dropdown-panel month-panel">
                                        {monthNames.map((name, idx) => (
                                            <div key={name} className={`dropdown-item ${viewDate.getMonth() === idx ? 'active' : ''}`} onClick={() => handleMonthSelect(idx)}>
                                                {name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="selector-group" ref={yearDropdownRef}>
                                <div className="year-selector" onClick={() => setShowYearDropdown(!showYearDropdown)}>
                                    <span>{viewDate.getFullYear()}</span>
                                    <ChevronDown size={14} className={`chev ${showYearDropdown ? 'rotate' : ''}`} />
                                </div>
                                {showYearDropdown && (
                                    <div className="dropdown-panel year-panel">
                                        {years.map(year => (
                                            <div key={year} className={`dropdown-item ${viewDate.getFullYear() === year ? 'active' : ''}`} onClick={() => handleYearSelect(year)}>
                                                {year}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="header-nav">
                            <button className="nav-btn small" onClick={goToPrevYear}><ChevronsLeft size={16} /></button>
                            <button className="nav-btn small" onClick={goToPrevMonth}><ChevronLeft size={16} /></button>
                            <button className="nav-btn small" onClick={goToNextMonth}><ChevronRight size={16} /></button>
                            <button className="nav-btn small" onClick={goToNextYear}><ChevronsRight size={16} /></button>
                        </div>
                    </div>

                    <div className="calendar-grid-container">
                        <div className="weekdays-grid">
                            {dayNames.map(name => <div key={name} className="weekday">{name}</div>)}
                        </div>
                        <div className="days-grid">
                            {renderDays()}
                        </div>
                    </div>
                </div>

                {/* Right Side: Event List (30%) */}
                <div className="calendar-sidebar">
                    <div className="sidebar-header">
                        <h3>Events</h3>
                        <p>Lorem ipsum dolor sit amet</p>
                    </div>

                    <div className="event-list">
                        {sideEvents.map((event, idx) => (
                            <div key={idx} className="event-card">
                                <div className="event-card-top">
                                    <span className="event-card-date">{event.date}</span>
                                    <MoreVertical size={14} className="more-icon" />
                                </div>
                                <h4 className="event-card-title">{event.title}</h4>
                                <div className="event-card-meta">
                                    <div className="meta-item">
                                        <Clock size={12} />
                                        <span>{event.time}</span>
                                    </div>
                                    <span className="event-card-price">{event.price}</span>
                                </div>
                                <div className="event-card-footer">
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: `${event.progress}%` }}></div>
                                    </div>
                                    <span className="event-card-tickets">{event.tickets}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
