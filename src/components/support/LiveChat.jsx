import React, { useState, useEffect, useRef } from 'react';
import { Search, Paperclip, Send, ArrowLeft, Play, MessageSquare, X, ChevronUp, ChevronDown, User, Monitor, Smartphone, HelpCircle, ArrowRightLeft, Download, Upload, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './live-chat.css';

export default function LiveChat({ onBack }) {
    const { t } = useTranslation();
    const [chatStep, setChatStep] = useState('options');
    const [activeChat, setActiveChat] = useState(1);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const messagesAreaRef = useRef(null);

    // New chat flow states
    const [newChatStep, setNewChatStep] = useState(1); // 1=account type, 2=issue type
    const [selectedAccountType, setSelectedAccountType] = useState('');
    const [selectedIssueType, setSelectedIssueType] = useState('');

    const chatList = [
        {
            id: 1,
            name: 'Martha Elliott',
            message: 'Okk, I got it i will do it after some time and let you know 👍',
            time: '2 August | 04:00 PM'
        },
        {
            id: 2,
            name: 'Jennifer Markus',
            message: 'Hey! Did you finish the Hi- Fi wireframes for flora app design?',
            time: 'Today | 05:30 PM'
        }
    ];

    const chatMessages = {
        1: [
            { type: 'received', text: "Hi Anni, What's Up? Please check your schedule", time: '04:30 PM' },
            { type: 'sent', text: 'Oh, hello! All perfectly.<br/>I will check it and get back to you soon 😌👍', time: '04:45 PM' },
            { type: 'received', text: 'I have updated few changes over there.', time: '04:48 PM' },
            { type: 'sent', text: 'Alright so cool let me see it. Thanks 👍', time: '05:00 PM' },
            { type: 'audio', time: '05:08 PM' },
            { type: 'sent', text: 'Cool! We need to update few changes', time: '05:10 PM' },
            { type: 'received', text: 'Okk, I got it i will do it after some time and let you know 👍', time: '05:15 PM' },
            { type: 'sent', text: "That's great, Good luck 👍", time: '05:18 PM' }
        ],
        2: [
            { type: 'received', text: 'Hey! Did you finish the Hi-Fi wireframes for flora app design?', time: '05:30 PM' },
            { type: 'sent', text: 'Hi Jennifer! Yes, I just completed them. Let me share the files with you.', time: '05:32 PM' },
            { type: 'received', text: 'That would be great! Can you also share the design system?', time: '05:34 PM' },
            { type: 'sent', text: 'Sure, I will send everything in a zip file shortly 👍', time: '05:36 PM' }
        ]
    };

    const selectedChat = chatList.find(c => c.id === activeChat);
    const messages = chatMessages[activeChat] || [];

    // Get matching message indices
    const matchIndices = [];
    if (searchTerm.trim()) {
        messages.forEach((msg, index) => {
            if (msg.text && msg.text.replace(/<br\s*\/?>/gi, ' ').toLowerCase().includes(searchTerm.toLowerCase())) {
                matchIndices.push(index);
            }
        });
    }

    // Scroll to current match
    useEffect(() => {
        if (matchIndices.length > 0 && messagesAreaRef.current) {
            const matchElements = messagesAreaRef.current.querySelectorAll('.search-match');
            const currentEl = matchElements[currentMatchIndex];
            if (currentEl) {
                currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentMatchIndex, searchTerm, activeChat]);

    // Reset match index when search term changes
    useEffect(() => {
        setCurrentMatchIndex(0);
    }, [searchTerm]);

    const goToNextMatch = () => {
        if (matchIndices.length > 0) {
            setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length);
        }
    };

    const goToPrevMatch = () => {
        if (matchIndices.length > 0) {
            setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length);
        }
    };

    // Filter sidebar chats
    const filteredChatList = sidebarSearch.trim()
        ? chatList.filter(c => c.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
        : chatList;

    const highlightText = (text) => {
        if (!searchTerm.trim()) return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(/<br\s*\/?>/gi, '|||BR|||').replace(regex, '<mark class="search-highlight">$1</mark>').replace(/\|\|\|BR\|\|\|/g, '<br/>');
    };

    const accountTypes = [
        { id: 'live', label: t('Live Account'), icon: <Monitor size={24} />, desc: t('Live Account desc') },
        { id: 'demo', label: t('Demo Account'), icon: <Smartphone size={24} />, desc: t('Demo Account desc') },
        { id: 'other', label: t('Other'), icon: <HelpCircle size={24} />, desc: t('Other desc') }
    ];

    const issueTypes = [
        { id: 'transaction', label: t('Transaction'), icon: <ArrowRightLeft size={24} />, desc: t('Transaction desc') },
        { id: 'withdraw', label: t('Withdraw issue'), icon: <Upload size={24} />, desc: t('Withdraw desc') },
        { id: 'deposit', label: t('Deposit issue'), icon: <Download size={24} />, desc: t('Deposit desc') },
        { id: 'general', label: t('General'), icon: <Info size={24} />, desc: t('General desc') }
    ];

    // Options screen
    if (chatStep === 'options') {
        return (
            <div className="live-chat-options-container">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} /> {t('Back to Support')}
                </button>
                <h2>{t('Live Chat Support')}</h2>
                <div className="chat-options-grid">
                    <div className="chat-option-card">
                        <div className="chat-option-icon new-chat-icon">
                            <MessageSquare size={32} />
                        </div>
                        <h3>{t('New Chat')}</h3>
                        <p>{t('New Chat desc')}</p>
                        <button className="chat-action-btn primary" onClick={() => { setChatStep('new-chat'); setNewChatStep(1); setSelectedAccountType(''); setSelectedIssueType(''); }}>
                            {t('Start New Chat')}
                        </button>
                    </div>
                    <div className="chat-option-card">
                        <div className="chat-option-icon existing-chat-icon">
                            <MessageSquare size={32} />
                        </div>
                        <h3>{t('Existing Chat')}</h3>
                        <p>{t('Existing Chat desc')}</p>
                        <button className="chat-action-btn secondary" onClick={() => setChatStep('chat-interface')}>
                            {t('Continue Existing Chat')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // New Chat Flow - Step 1: Account Type
    if (chatStep === 'new-chat' && newChatStep === 1) {
        return (
            <div className="live-chat-options-container">
                <button className="back-btn" onClick={() => setChatStep('options')}>
                    <ArrowLeft size={20} /> {t('Back')}
                </button>
                <div className="step-indicator">
                    <div className="step active">1</div>
                    <div className="step-line"></div>
                    <div className="step">2</div>
                </div>
                <h2>{t('Select Account Type')}</h2>
                <p className="step-subtitle">{t('Account type subtitle')}</p>
                <div className="selection-cards-grid">
                    {accountTypes.map(acc => (
                        <div
                            key={acc.id}
                            className={`selection-card ${selectedAccountType === acc.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAccountType(acc.id)}
                        >
                            <div className="selection-card-icon">{acc.icon}</div>
                            <h4>{acc.label}</h4>
                            <p>{acc.desc}</p>
                        </div>
                    ))}
                </div>
                <button
                    className="chat-action-btn primary continue-btn"
                    disabled={!selectedAccountType}
                    onClick={() => setNewChatStep(2)}
                >
                    {t('Continue')}
                </button>
            </div>
        );
    }

    // New Chat Flow - Step 2: Issue Type
    if (chatStep === 'new-chat' && newChatStep === 2) {
        return (
            <div className="live-chat-options-container">
                <button className="back-btn" onClick={() => setNewChatStep(1)}>
                    <ArrowLeft size={20} /> {t('Back')}
                </button>
                <div className="step-indicator">
                    <div className="step completed">✓</div>
                    <div className="step-line active-line"></div>
                    <div className="step active">2</div>
                </div>
                <h2>{t('Select Issue Type')}</h2>
                <p className="step-subtitle">{t('Issue type subtitle')}</p>
                <div className="selection-cards-grid four-cols">
                    {issueTypes.map(issue => (
                        <div
                            key={issue.id}
                            className={`selection-card ${selectedIssueType === issue.id ? 'selected' : ''}`}
                            onClick={() => setSelectedIssueType(issue.id)}
                        >
                            <div className="selection-card-icon">{issue.icon}</div>
                            <h4>{issue.label}</h4>
                            <p>{issue.desc}</p>
                        </div>
                    ))}
                </div>
                <button
                    className="chat-action-btn primary continue-btn"
                    disabled={!selectedIssueType}
                    onClick={() => setChatStep('new-chat-conversation')}
                >
                    {t('Continue')}
                </button>
            </div>
        );
    }

    // New Chat Conversation (fresh, no sidebar)
    if (chatStep === 'new-chat-conversation') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        return (
            <div className="live-chat-interface-wrapper">
                <div className="live-chat-interface new-chat-full">
                    <div className="chat-main">
                        <div className="chat-main-header">
                            <div className="current-chat-info">
                                <button className="icon-btn" onClick={() => setChatStep('options')} style={{ marginRight: '8px' }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="default-avatar header-default-avatar">
                                    <User size={18} />
                                </div>
                                <h3>{t('Support Agent')}</h3>
                            </div>
                            <div className="header-actions">
                                <span className="new-chat-badge">{selectedAccountType} • {selectedIssueType}</span>
                            </div>
                        </div>

                        <div className="chat-messages-area">
                            <div className="date-separator"><span>Today | {timeStr}</span></div>

                            <div className="message received">
                                <div className="message-bubble">
                                    Hello! Welcome to LiveFxHub Support. 👋<br />
                                    I can see you have a <strong>{selectedIssueType}</strong> related query for your <strong>{selectedAccountType}</strong> account.<br />
                                    How can I help you today?
                                </div>
                                <span className="message-time">{timeStr}</span>
                            </div>
                        </div>

                        <div className="chat-input-area">
                            <label className="icon-btn file-upload-btn">
                                <Paperclip size={18} />
                                <input type="file" hidden />
                            </label>
                            <div className="input-wrapper">
                                <input type="text" placeholder={t('Type message')} />
                            </div>
                            <button className="icon-btn action-btn blue-btn"><Send size={18} color="white" /></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Existing Chat Interface
    // Track which messages are matches and their position
    let matchCounter = -1;

    return (
        <div className="live-chat-interface-wrapper">
            <div className="live-chat-interface">
                <div className="chat-sidebar">
                    <div className="sidebar-back-header">
                        <button className="back-btn" onClick={() => setChatStep('options')}>
                            <ArrowLeft size={16} /> {t('Back to Options')}
                        </button>
                    </div>

                    <div className="chat-search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={t('Search or start')}
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                        />
                    </div>

                    <div className="chat-list">
                        {filteredChatList.map((chat) => (
                            <div
                                key={chat.id}
                                className={`chat-list-item ${chat.id === activeChat ? 'active' : ''}`}
                                onClick={() => setActiveChat(chat.id)}
                            >
                                <div className="chat-avatar">
                                    <div className="default-avatar">
                                        <User size={20} />
                                    </div>
                                </div>
                                <div className="chat-info">
                                    <h4>{chat.name}</h4>
                                    <p className="chat-preview">{chat.message}</p>
                                    <div className="chat-time">
                                        {chat.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chat-main">
                    <div className="chat-main-header">
                        <div className="current-chat-info">
                            <div className="default-avatar header-default-avatar">
                                <User size={18} />
                            </div>
                            <h3>{selectedChat.name}</h3>
                        </div>
                        <div className="header-actions">
                            <button className="icon-btn search-btn" onClick={() => { setSearchOpen(!searchOpen); setSearchTerm(''); setCurrentMatchIndex(0); }}>
                                {searchOpen ? <X size={18} /> : <Search size={18} />}
                            </button>
                        </div>
                    </div>

                    {searchOpen && (
                        <div className="chat-search-bar">
                            <Search size={16} className="bar-search-icon" />
                            <input
                                type="text"
                                placeholder={t('Search in conversation')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {searchTerm.trim() && (
                                <div className="search-nav">
                                    <span className="search-count">
                                        {matchIndices.length > 0 ? `${currentMatchIndex + 1}/${matchIndices.length}` : '0/0'}
                                    </span>
                                    <button className="icon-btn search-nav-btn" onClick={goToPrevMatch} disabled={matchIndices.length === 0}>
                                        <ChevronUp size={16} />
                                    </button>
                                    <button className="icon-btn search-nav-btn" onClick={goToNextMatch} disabled={matchIndices.length === 0}>
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="chat-messages-area" ref={messagesAreaRef}>
                        <div className="date-separator"><span>Today | 05:30 PM</span></div>

                        {messages.map((msg, index) => {
                            if (msg.type === 'audio') {
                                return (
                                    <div key={index} className="message received audio-message">
                                        <div className="message-bubble audio-bubble">
                                            <button className="play-btn"><Play size={16} fill="white" /></button>
                                            <div className="audio-waveform">
                                                <div className="wave w-1"></div>
                                                <div className="wave w-2"></div>
                                                <div className="wave w-3"></div>
                                                <div className="wave w-2"></div>
                                                <div className="wave w-4"></div>
                                                <div className="wave w-2"></div>
                                                <div className="wave w-3"></div>
                                                <div className="wave w-1"></div>
                                            </div>
                                            <span className="audio-time">01:24</span>
                                        </div>
                                        <span className="message-time">{msg.time}</span>
                                    </div>
                                );
                            }

                            const hasMatch = searchTerm.trim() && msg.text && msg.text.replace(/<br\s*\/?>/gi, ' ').toLowerCase().includes(searchTerm.toLowerCase());

                            if (hasMatch) {
                                matchCounter++;
                            }

                            const isCurrentMatch = hasMatch && matchCounter === currentMatchIndex;

                            return (
                                <div key={index} className={`message ${msg.type} ${hasMatch ? 'search-match' : ''} ${isCurrentMatch ? 'current-match' : ''}`}>
                                    <div className="message-bubble" dangerouslySetInnerHTML={{ __html: highlightText(msg.text) }} />
                                    <span className="message-time">{msg.time}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="chat-input-area">
                        <label className="icon-btn file-upload-btn">
                            <Paperclip size={18} />
                            <input type="file" hidden />
                        </label>
                        <div className="input-wrapper">
                            <input type="text" placeholder={t('Type message')} />
                        </div>
                        <button className="icon-btn action-btn blue-btn"><Send size={18} color="white" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
