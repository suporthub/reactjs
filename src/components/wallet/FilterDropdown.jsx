import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

export default function FilterDropdown({ icon: Icon, value, options, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (option) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <button
                className={`custom-dropdown-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {Icon && <Icon size={18} className="dropdown-icon" />}
                <span className="dropdown-value">{value}</span>
                {isOpen ? <ChevronUp size={16} className="dropdown-chevron" /> : <ChevronDown size={16} className="dropdown-chevron" />}
            </button>

            {isOpen && (
                <div className="custom-dropdown-menu">
                    {options.map((option, index) => {
                        const isValueObj = typeof option === 'object';
                        const label = isValueObj ? option.label : option;
                        const hasSubmenu = isValueObj && option.hasSubmenu;

                        return (
                            <div
                                key={index}
                                className={`custom-dropdown-item ${value === label ? 'selected' : ''}`}
                                onClick={() => handleOptionClick(label)}
                            >
                                <span className="item-label">{label}</span>
                                {hasSubmenu && <ChevronRight size={14} className="submenu-indicator" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
