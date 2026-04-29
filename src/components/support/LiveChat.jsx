import React, { useState, useEffect, useRef } from 'react';
import { Search, Paperclip, Send, ArrowLeft, Play, MessageSquare, X, ChevronUp, ChevronDown, User, Monitor, Smartphone, HelpCircle, ArrowRightLeft, Download, Upload, Info, Hash, Smile, Maximize, Minimize, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './live-chat.css';

export default function LiveChat({ onBack }) {
    const { t } = useTranslation();

    // --- UI States ---
    const [chatStep, setChatStep] = useState('options');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
    const [isNewChatExpanded, setIsNewChatExpanded] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [showRelatedQueriesModal, setShowRelatedQueriesModal] = useState(false);
    const [typingIndicator, setTypingIndicator] = useState(''); // e.g. 'Agent is typing...'
    const messagesAreaRef = useRef(null);

    // --- New chat flow states ---
    const [newChatStep, setNewChatStep] = useState(1);
    const [selectedAccountType, setSelectedAccountType] = useState('');
    const [selectedIssueType, setSelectedIssueType] = useState('');

    // --- Dynamic API States ---
    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [activeChatStatus, setActiveChatStatus] = useState('open');
    const [isLoading, setIsLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const ws = useRef(null);

    // Helper: Extract user data from localStorage — tries every key the app might use
    const getUserData = () => {
        // All keys your app might store user data under — checked in priority order
        const candidateKeys = ['user', 'userData', 'userInfo', 'currentUser', 'auth_user', 'authUser', 'profile', 'userProfile', 'loginUser'];

        for (const key of candidateKeys) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const data = JSON.parse(raw);
                // Support both flat objects and nested { user: {...} } shapes
                const obj = data?.user || data;
                const email = obj?.email || obj?.Email || obj?.user_email || obj?.userEmail || '';
                const phone = obj?.phone || obj?.Phone || obj?.mobile || obj?.phone_number || obj?.phoneNumber || '';
                const name = obj?.name || obj?.Name || obj?.username || obj?.full_name || obj?.fullName || (email ? email.split('@')[0] : '');
                if (email || phone || name) {
                    return { email, phone, name };
                }
            } catch (e) {
                // Not valid JSON — try treating it as a plain string email
                const raw_str = raw.trim();
                if (raw_str.includes('@')) {
                    return { email: raw_str, phone: '', name: raw_str.split('@')[0] };
                }
            }
        }

        // Last resort: scan ALL localStorage keys for any object that looks like user data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const data = JSON.parse(raw);
                const obj = data?.user || data;
                if (obj && typeof obj === 'object') {
                    const email = obj?.email || obj?.Email || obj?.user_email || '';
                    const phone = obj?.phone || obj?.Phone || obj?.mobile || '';
                    const name = obj?.name || obj?.Name || obj?.username || (email ? email.split('@')[0] : '');
                    if (email) {
                        console.info(`[LiveChat] Found user data under localStorage key: "${key}"`);
                        return { email, phone, name };
                    }
                }
            } catch (e) { /* skip non-JSON */ }
        }

        // No user data found anywhere — return empty strings (never hardcode)
        console.warn('[LiveChat] No user data found in localStorage. User may not be logged in.');
        return { email: '', phone: '', name: '' };
    };

    // Helper: Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        // Generate a preview URL for images
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    // Helper: Clear selected file
    const handleClearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
    };

    // Helper: Format Time to 24-Hour (HH:MM)
    const formatTime24Hour = (timestamp) => {
        if (!timestamp) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            return timestamp;
        }
    };

    // Helper: Format full date + time for sidebar chat list (e.g. "28 Apr, 14:27")
    const formatDateTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            const day = date.getDate();
            const month = date.toLocaleString('en-GB', { month: 'short' });
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${day} ${month}, ${time}`;
        } catch (e) {
            return timestamp;
        }
    };

    // Helper: Format full date + time for sidebar display (e.g. "28 Apr, 12:00")
    const formatDateTimeDisplay = (timestamp) => {
        if (!timestamp) return formatTime24Hour(null);
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${day} ${month}, ${time}`;
        } catch (e) {
            return timestamp;
        }
    };

    // Helper: Format message timestamp as date + time (e.g. "28 Apr 12:00")
    const formatMessageDateTime = (timestamp) => {
        if (!timestamp) return formatTime24Hour(null);
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            if (isToday) return time;
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            return `${day} ${month}, ${time}`;
        } catch (e) {
            return timestamp;
        }
    };
    const handleStartNewChat = async () => {
        setIsLoading(true);
        const { email, phone, name } = getUserData();

        try {
            const response = await fetch('https://support.livefxhub.com/api/start-chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || email.split('@')[0] || 'User',
                    email: email,
                    phone: phone,
                    subject: `${selectedIssueType} query for ${selectedAccountType}`,
                    message: `Initial Request: ${selectedIssueType} on ${selectedAccountType} account.`,
                    account_type: selectedAccountType,
                    issue_type: selectedIssueType,
                    company_id: 1
                })
            });

            const data = await response.json();
            if (data.chat_id) {
                setActiveChat(data.chat_id);
                setActiveChatStatus('open');
                setMessages([]);
                // Also load existing chats so sidebar shows active/closed sections
                const { email } = getUserData();
                try {
                    const existingRes = await fetch('https://support.livefxhub.com/api/get-user-chats/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const existingData = await existingRes.json();
                    if (existingData.success && existingData.chats) {
                        const formatted = existingData.chats.map(chat => ({
                            id: chat.chat_id,
                            name: chat.subject || 'Support Chat',
                            message: chat.last_message?.content?.substring(0, 60) || `Status: ${chat.status}`,
                            time: formatDateTimeDisplay(chat.started_at || chat.created_at || ''),
                            status: chat.status
                        }));
                        setChatList(formatted);
                    }
                } catch (_) { /* silently ignore */ }
                setChatStep('new-chat-conversation');
            }
        } catch (error) {
            console.error("Error starting chat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // API 2: LOAD EXISTING CHATS
    const handleLoadExistingChats = async () => {
        setIsLoading(true);
        const { email } = getUserData();

        try {
            const response = await fetch('https://support.livefxhub.com/api/get-user-chats/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();
            console.log("Existing Chats API Response:", data); // <--- Use this to check if backend sends chats!

            if (data.success && data.chats) {
                const formattedChats = data.chats.map(chat => {
                    const dateVal = chat.started_at || chat.created_at || '';
                    const lastMsg = chat.last_message;
                    return {
                        id: chat.chat_id,
                        name: chat.subject || 'Support Chat',
                        message: lastMsg?.content
                            ? lastMsg.content.substring(0, 60)
                            : `Status: ${chat.status}`,
                        time: formatDateTimeDisplay(dateVal),
                        status: chat.status
                    };
                });
                setChatList(formattedChats);
                setChatStep('chat-interface');

                if (formattedChats.length > 0) handleSelectChat(formattedChats[0]);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // API 3: SELECT CHAT & FETCH HISTORY
    const handleSelectChat = async (chat) => {
        setActiveChat(chat.id);
        setActiveChatStatus(chat.status);
        setSearchOpen(false);

        // ✅ ALWAYS load history (important fix)
        setMessages([
            { type: 'system', text: 'Loading chat history…', time: formatTime24Hour(new Date()) }
        ]);

        try {
            const response = await fetch(`https://support.livefxhub.com/api/get-chat-history/${chat.id}/`);
            if (!response.ok) throw new Error(`Server returned ${response.status}`);

            const data = await response.json();

            if (data.success && data.messages) {
                const formattedMsgs = data.messages.map(msg => {
                    let msgType = 'agent';
                    if (msg.sender_type === 'SYSTEM') msgType = 'system';
                    else if (msg.sender_type === 'USER') msgType = 'user';

                    // ✅ FIX: Add full URL (prevents 404)
                    const fullFileUrl = msg.file_url
                        ? `https://support.livefxhub.com${msg.file_url}`
                        : null;

                    if (fullFileUrl) {
                        const fname = fullFileUrl.split('/').pop();
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fname);

                        const fileHtml = isImage
                            ? `<a href="${fullFileUrl}" target="_blank"><img src="${fullFileUrl}" style="max-width:200px;border-radius:8px;" /></a>`
                            : `<a href="${fullFileUrl}" target="_blank">📎 ${fname}</a>`;

                        return {
                            type: msgType,
                            text: fileHtml,
                            time: formatMessageDateTime(msg.timestamp)
                        };
                    }

                    return {
                        type: msgType,
                        text: msg.content || '',
                        senderName: msg.sender_name || '',
                        time: formatMessageDateTime(msg.timestamp)
                    };
                });

                setMessages(formattedMsgs);
            } else {
                setMessages([
                    { type: 'system', text: 'No messages found.', time: formatTime24Hour(new Date()) }
                ]);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
            setMessages([
                { type: 'system', text: 'Could not load chat history.', time: formatTime24Hour(new Date()) }
            ]);
        }
    };

    // WEBSOCKET CONNECTION
    useEffect(() => {
        const isChatView = chatStep === 'new-chat-conversation' || chatStep === 'chat-interface';

        if (isChatView && activeChat && activeChatStatus !== 'closed' && activeChatStatus !== 'ended') {
            ws.current = new WebSocket(`wss://support.livefxhub.com/ws/chat/${activeChat}/`);

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);

                // Skip echo of user's own messages — already added optimistically
                // from_api=false + message_type='user' means it's our own message bounced back
                if (!data.from_api && String(data.message_type || '').toLowerCase() === 'user') {
                    return;
                }

                // ── Detect chat ending (from agent or user) ──────────────────
                const msgText = String(data.message || '').toLowerCase();
                const isEndEvent = data.action === 'end_chat'
                    || msgText.includes('ended the chat')
                    || msgText.includes('chat ended by agent')
                    || msgText.includes('chat has ended');

                if (isEndEvent) {
                    setActiveChatStatus('closed');
                    setChatList(prevList => prevList.map(chat =>
                        chat.id === activeChat ? { ...chat, status: 'closed' } : chat
                    ));
                }

                let msgType = 'agent';
                const safeMsgType = String(data.message_type || '').toLowerCase();
                if (safeMsgType === 'system') msgType = 'system';
                else if (data.sender_type === 'visitor' || safeMsgType === 'user') msgType = 'user';

                // ── Build display text ────────────────────────────────────────
                let displayText = data.message || '';

                // Server-side file upload URL (from upload_chat_file endpoint)
                if (data.file_url) {
                    const fname = data.file_name || data.file_url.split('/').pop();
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fname);
                    const fileHtml = isImage
                        ? `<a href="${data.file_url}" target="_blank" rel="noopener noreferrer"><img src="${data.file_url}" alt="${fname}" style="max-width:200px;border-radius:8px;" /></a>`
                        : `<a href="${data.file_url}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:6px;color:inherit;">📎 <span style="text-decoration:underline">${fname}</span></a>`;
                    displayText = displayText ? `${displayText}<br/>${fileHtml}` : fileHtml;
                }

                // Legacy base64 file (fallback)
                if (data.file && !data.file_url) {
                    const f = data.file;
                    const isImage = f.type && f.type.startsWith('image/');
                    const fileHtml = isImage
                        ? `<img src="data:${f.type};base64,${f.data}" alt="${f.name}" style="max-width:200px;border-radius:8px;" />`
                        : `📎 <strong>${f.name}</strong>`;
                    displayText = displayText ? `${displayText}<br/>${fileHtml}` : fileHtml;
                }

                // ── Typing indicator ────────────────────────────────────────
                if (data.type === 'typing' || data.action === 'typing') {
                    const who = String(data.sender_type || data.message_type || '').toLowerCase();
                    if (who === 'agent' || data.from_api) {
                        setTypingIndicator(t('Agent is typing...'));
                        setTimeout(() => setTypingIndicator(''), 3000);
                    }
                    return;
                }

                if (!displayText) return; // skip empty frames

                setTypingIndicator(''); // clear on real message
                setMessages(prev => [...prev, {
                    type: msgType,
                    text: displayText,
                    senderName: data.sender_name || '',
                    time: formatMessageDateTime(data.timestamp || new Date())
                }]);
            };

            return () => {
                if (ws.current) ws.current.close();
            };
        }
    }, [chatStep, activeChat, activeChatStatus]);

    // SEND MESSAGE — text via WS, file via REST upload
    const handleSendMessage = async (customText = null) => {
        const textToSend = typeof customText === 'string' ? customText : messageInput;
        const { email, name } = getUserData();
        const senderName = name || email.split('@')[0] || 'User';

        // ── File upload via Base64 and WebSocket ──────────────────────────────
        if (selectedFile) {
            const file = selectedFile;
            const fname = file.name;
            const previewUrl = filePreview;
            const isImage = file.type.startsWith('image/');
            handleClearFile();

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64DataUrl = reader.result;

                let fileHtml = '';
                if (isImage) {
                    fileHtml = `<img src="${base64DataUrl}" alt="${fname}" style="max-width:200px;border-radius:8px;" />`;
                } else {
                    fileHtml = `<a href="${base64DataUrl}" download="${fname}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:6px;color:inherit;">📎 <span style="text-decoration:underline">${fname}</span></a>`;
                }

                // Add to local UI
                setMessages(prev => [...prev, {
                    type: 'user',
                    text: fileHtml,
                    senderName,
                    time: formatMessageDateTime(new Date())
                }]);

                // Send to agent via WebSocket
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({
                        message: fileHtml,
                        message_type: 'user',
                        sender_name: senderName
                    }));
                }
            };

            reader.onerror = () => {
                console.error('Failed to read file');
                setMessages(prev => [...prev, { type: 'system', text: `❌ Failed to read file: ${fname}`, time: formatMessageDateTime(new Date()) }]);
            };

            reader.readAsDataURL(file);
        }

        // ── Text message via WebSocket ────────────────────────────────────────
        if (textToSend.trim()) {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    message: textToSend,
                    message_type: 'user',
                    sender_name: senderName
                }));
                setMessages(prev => [...prev, {
                    type: 'user',
                    text: textToSend,
                    senderName,
                    time: formatMessageDateTime(new Date())
                }]);
                if (typeof customText !== 'string') {
                    setMessageInput('');
                }
            }
        }
    };

    // END CHAT (user-initiated)
    const handleEndChat = () => {
        setShowEndChatConfirm(true);
    };

    const confirmEndChat = () => {
        setShowEndChatConfirm(false);
        const { email, name } = getUserData();
        const senderName = name || email.split('@')[0] || 'User';

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            // Send end_chat action — consumers.py will save it, broadcast to agent, and close
            ws.current.send(JSON.stringify({
                action: 'end_chat',
                chat_id: activeChat,
                ended_by_name: senderName,
                sender_name: senderName,
            }));
            // Close after 500ms so the server gets the message first
            setTimeout(() => { if (ws.current) ws.current.close(); }, 500);
        }

        setActiveChatStatus('closed');
        setChatList(prevList => prevList.map(chat =>
            chat.id === activeChat ? { ...chat, status: 'closed' } : chat
        ));
        setMessages(prev => [...prev, {
            type: 'system',
            text: t('You have ended this chat session.'),
            time: formatMessageDateTime(new Date())
        }]);
    };

    const selectedChat = chatList.find(c => c.id === activeChat) || { name: t('Support Agent') };
    let matchCounter = -1;

    const matchIndices = [];
    if (searchTerm.trim()) {
        messages.forEach((msg, index) => {
            if (msg.text && msg.text.replace(/<br\s*\/?>/gi, ' ').toLowerCase().includes(searchTerm.toLowerCase())) {
                matchIndices.push(index);
            }
        });
    }

    useEffect(() => {
        if (matchIndices.length > 0 && messagesAreaRef.current) {
            const matchElements = messagesAreaRef.current.querySelectorAll('.search-match');
            const currentEl = matchElements[currentMatchIndex];
            if (currentEl) currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentMatchIndex, searchTerm, activeChat, messages]);

    useEffect(() => { setCurrentMatchIndex(0); }, [searchTerm]);

    useEffect(() => {
        if (!searchTerm && messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
    }, [messages, searchTerm]);

    const goToNextMatch = () => { if (matchIndices.length > 0) setCurrentMatchIndex((prev) => (prev + 1) % matchIndices.length); };
    const goToPrevMatch = () => { if (matchIndices.length > 0) setCurrentMatchIndex((prev) => (prev - 1 + matchIndices.length) % matchIndices.length); };

    const filteredChatList = chatList.filter(c =>
        c.name.toLowerCase().includes(sidebarSearch.toLowerCase())
    );
    const highlightText = (text) => {
        if (!searchTerm.trim()) return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(/<br\s*\/?>/gi, '|||BR|||').replace(regex, '<mark class="search-highlight">$1</mark>').replace(/\|\|\|BR\|\|\|/g, '<br/>');
    };

    // Config arrays
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

    // Options Screen
    if (chatStep === 'options') {
        return (
            <div className="live-chat-options-container">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} /> {t('Back to Support')}
                </button>
                <h2>{t('Live Chat Support')}</h2>
                <div className="chat-options-grid">
                    <div className="chat-option-card">
                        <div className="chat-option-icon new-chat-icon"><MessageSquare size={32} /></div>
                        <h3>{t('New Chat')}</h3>
                        <p>{t('New Chat desc')}</p>
                        <button className="chat-action-btn primary" onClick={() => { setChatStep('new-chat'); setNewChatStep(1); setSelectedAccountType(''); setSelectedIssueType(''); }}>
                            {t('Start New Chat')}
                        </button>
                    </div>
                    <div className="chat-option-card">
                        <div className="chat-option-icon existing-chat-icon"><MessageSquare size={32} /></div>
                        <h3>{t('Existing Chat')}</h3>
                        <p>{t('Existing Chat desc')}</p>
                        <button className="chat-action-btn secondary" onClick={handleLoadExistingChats} disabled={isLoading}>
                            {isLoading ? t('Loading...') : t('Continue Existing Chat')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // New Chat Flow - Step 1
    if (chatStep === 'new-chat' && newChatStep === 1) {
        return (
            <div className="live-chat-options-container">
                <button className="back-btn" onClick={() => setChatStep('options')}>
                    <ArrowLeft size={20} /> {t('Back')}
                </button>
                <div className="step-indicator">
                    <div className="step active">1</div><div className="step-line"></div><div className="step">2</div>
                </div>
                <h2>{t('Select Account Type')}</h2>
                <p className="step-subtitle">{t('Account type subtitle')}</p>
                <div className="selection-cards-grid">
                    {accountTypes.map(acc => (
                        <div key={acc.id} className={`selection-card ${selectedAccountType === acc.label ? 'selected' : ''}`} onClick={() => setSelectedAccountType(acc.label)}>
                            <div className="selection-card-icon">{acc.icon}</div>
                            <h4>{acc.label}</h4><p>{acc.desc}</p>
                        </div>
                    ))}
                </div>
                <button className="chat-action-btn primary continue-btn" disabled={!selectedAccountType} onClick={() => setNewChatStep(2)}>{t('Continue')}</button>
            </div>
        );
    }

    // New Chat Flow - Step 2
    if (chatStep === 'new-chat' && newChatStep === 2) {
        return (
            <div className="live-chat-options-container">
                <button className="back-btn" onClick={() => setNewChatStep(1)}>
                    <ArrowLeft size={20} /> {t('Back')}
                </button>
                <div className="step-indicator">
                    <div className="step completed">✓</div><div className="step-line active-line"></div><div className="step active">2</div>
                </div>
                <h2>{t('Select Issue Type')}</h2>
                <p className="step-subtitle">{t('Issue type subtitle')}</p>
                <div className="selection-cards-grid four-cols">
                    {issueTypes.map(issue => (
                        <div key={issue.id} className={`selection-card ${selectedIssueType === issue.label ? 'selected' : ''}`} onClick={() => setSelectedIssueType(issue.label)}>
                            <div className="selection-card-icon">{issue.icon}</div>
                            <h4>{issue.label}</h4><p>{issue.desc}</p>
                        </div>
                    ))}
                </div>
                <button className="chat-action-btn primary continue-btn" disabled={!selectedIssueType || isLoading} onClick={handleStartNewChat}>
                    {isLoading ? t('Connecting...') : t('Continue')}
                </button>
            </div>
        );
    }

    // Controls whether the input box renders or disappears completely
    const handleStartNewAfterClose = () => {
        setChatStep('new-chat');
        setNewChatStep(1);
        setSelectedAccountType('');
        setSelectedIssueType('');
        setActiveChat(null);
        setMessages([]);
        setActiveChatStatus('open');
        handleClearFile();
    };

    const renderChatInputOrReset = () => {
        if (activeChatStatus === 'closed') {
            return (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)' }}>
                    💬 {t('This chat session has ended.')}
                </div>
            );
        }
        return (
            <div className="chat-input-area" style={{ flexDirection: 'column', gap: '6px', padding: '12px 20px' }}>
                {selectedFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: '#f0f4ff', borderRadius: '8px', fontSize: '13px', width: '100%' }}>
                        {filePreview
                            ? <img src={filePreview} alt="preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                            : <Paperclip size={16} />
                        }
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                        <button onClick={handleClearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}><X size={14} /></button>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                        <button className="icon-btn" style={{ color: '#3b82f6', padding: 0 }}><Hash size={20} /></button>
                        <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ color: showEmojiPicker ? '#3b82f6' : '#9ca3af', padding: 0 }}>
                            <Smile size={20} />
                        </button>

                        {showEmojiPicker && (
                            <div className="emoji-picker" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '32px',
                                marginBottom: '12px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '4px',
                                zIndex: 100,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                                {['📈', '📉', '💰', '💸', '💵', '🏦', '💼', '📊', '🚀', '💎', '🐂', '🐻', '🤝', '✍️', '⏳', '🔔', '💡', '✅', '❌', '❓', '👍', '👎', '🙏', '🤔', '😎'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            setMessageInput(prev => prev + emoji);
                                        }}
                                        style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                        onMouseOver={(e) => e.target.style.background = 'var(--border-color)'}
                                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="input-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'transparent' }}>
                        <input
                            type="text"
                            placeholder={t('Start typing...')}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            style={{ width: '100%', padding: '10px 0', fontSize: '0.9rem', outline: 'none', border: 'none', background: 'transparent', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label className="icon-btn file-upload-btn" style={{ padding: 0 }}>
                            <Paperclip size={20} color="#9ca3af" />
                            <input type="file" hidden accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} />
                        </label>
                        <button className="icon-btn action-btn blue-btn" onClick={handleSendMessage} disabled={!messageInput.trim() && !selectedFile} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={18} color="white" style={{ marginLeft: '-2px', marginTop: '2px' }} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (chatStep === 'new-chat-conversation') {
        const dateStr = new Date().toLocaleDateString();
        return (
            <div className="live-chat-interface-wrapper" style={{ height: 'calc(100vh - 60px)', maxHeight: 'calc(100vh - 60px)' }}>
                <div className={`live-chat-interface ${isNewChatExpanded ? 'new-chat-full' : ''}`} style={{ minHeight: 0, flex: 1 }}>
                    {!isNewChatExpanded && (
                        <div className="chat-sidebar">
                            <div className="sidebar-back-header">
                                <button className="back-btn" onClick={() => setChatStep('options')}>
                                    <ArrowLeft size={16} /> {t('Back to Options')}
                                </button>
                            </div>
                            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                                {/* Active Chats */}
                                {chatList.filter(c => c.status !== 'closed' && c.status !== 'ended').length > 0 && (
                                    <>
                                        <div className="wa-section-heading">{t('Active Chats')}</div>
                                        {chatList.filter(c => c.status !== 'closed' && c.status !== 'ended').map(chat => (
                                            <div key={chat.id} className={`wa-chat-item ${chat.id === activeChat ? 'active' : ''}`} onClick={() => handleSelectChat(chat)}>
                                                <div className="wa-avatar-container">
                                                    <div className="wa-avatar"><User size={22} /></div>
                                                    <span className="wa-status-dot active"></span>
                                                </div>
                                                <div className="wa-chat-info">
                                                    <div className="wa-chat-header">
                                                        <h4 className="wa-chat-name">{chat.name}</h4>
                                                        <span className="wa-chat-time">{chat.time}</span>
                                                    </div>
                                                    <p className="wa-chat-preview">{chat.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {/* Existing / Closed Chats */}
                                {chatList.filter(c => c.status === 'closed' || c.status === 'ended').length > 0 && (
                                    <>
                                        <div className="wa-section-heading">{t('Closed Chats')}</div>
                                        {chatList.filter(c => c.status === 'closed' || c.status === 'ended').map(chat => (
                                            <div key={chat.id} className={`wa-chat-item ${chat.id === activeChat ? 'active' : ''}`} onClick={() => handleSelectChat(chat)}>
                                                <div className="wa-avatar-container">
                                                    <div className="wa-avatar"><User size={22} /></div>
                                                    <span className="wa-status-dot closed"></span>
                                                </div>
                                                <div className="wa-chat-info">
                                                    <div className="wa-chat-header">
                                                        <h4 className="wa-chat-name">{chat.name}</h4>
                                                        <span className="wa-chat-time">{chat.time}</span>
                                                    </div>
                                                    <p className="wa-chat-preview">{chat.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {chatList.length === 0 && (
                                    <p style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('No previous chats')}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="chat-main">
                        <div className="chat-main-header">
                            <div className="current-chat-info">
                                <button className="icon-btn" onClick={() => setChatStep('options')} style={{ marginRight: '8px' }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="default-avatar header-default-avatar"><User size={18} /></div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                                        {selectedIssueType
                                            ? `${selectedIssueType} query for ${selectedAccountType}`
                                            : t('Support')}
                                    </h3>
                                    {typingIndicator ? (
                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontStyle: 'italic' }}>{typingIndicator}</span>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedAccountType}</span>
                                    )}
                                </div>
                            </div>
                            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button className="icon-btn" onClick={() => setIsNewChatExpanded(!isNewChatExpanded)} title={isNewChatExpanded ? t("Restore panel") : t("Expand chat")}>
                                    {isNewChatExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
                                </button>
                                <span className="new-chat-badge">{selectedAccountType} • {selectedIssueType}</span>
                                <div className="more-menu-container">
                                    <button className="icon-btn" onClick={() => setShowHeaderMenu(prev => !prev)} title={t('More options')}>
                                        <MoreVertical size={18} />
                                    </button>
                                    {showHeaderMenu && (
                                        <div className="more-menu-dropdown" onClick={() => setShowHeaderMenu(false)}>
                                            {(activeChatStatus !== 'closed' && activeChatStatus !== 'ended') && (
                                                <button className="more-menu-item danger" onClick={handleEndChat}>
                                                    🛑 {t('End Chat')}
                                                </button>
                                            )}
                                            {(activeChatStatus === 'closed' || activeChatStatus === 'ended') && (
                                                <button className="more-menu-item" onClick={handleStartNewAfterClose} style={{ color: '#10b981' }}>
                                                    ✚ {t('Start New Chat')}
                                                </button>
                                            )}
                                            <button className="more-menu-item" onClick={() => { setShowRelatedQueriesModal(true); setShowHeaderMenu(false); }}>
                                                💡 {t('Related Queries')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="chat-messages-area" ref={messagesAreaRef}>
                            <div className="date-separator"><span>{dateStr}</span></div>
                            {messages.map((msg, index) => {
                                const { name } = getUserData();
                                const userName = name || 'You';
                                const senderLabel = msg.type === 'user'
                                    ? t('You')
                                    : msg.type === 'agent'
                                        ? (msg.senderName || t('Agent'))
                                        : null;
                                return (
                                    <div key={index} className={`message ${msg.type}`}>
                                        {senderLabel && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'block', textAlign: msg.type === 'user' ? 'right' : 'left', paddingRight: msg.type === 'user' ? '4px' : '0', paddingLeft: msg.type !== 'user' ? '4px' : '0' }}>
                                                {senderLabel}
                                            </span>
                                        )}
                                        <div className="message-bubble" dangerouslySetInnerHTML={{ __html: msg.text }} />
                                        <span className="message-time">{msg.time}</span>
                                    </div>
                                );
                            })}
                            {typingIndicator && (
                                <div className="message agent" style={{ opacity: 0.7 }}>
                                    <div className="message-bubble" style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ display: 'inline-flex', gap: '3px' }}>
                                            <span className="typing-dot"></span>
                                            <span className="typing-dot"></span>
                                            <span className="typing-dot"></span>
                                        </span>
                                        {typingIndicator}
                                    </div>
                                </div>
                            )}
                        </div>
                        {renderChatInputOrReset()}
                    </div>
                </div>

                {/* End Chat Confirm Dialog */}
                {showEndChatConfirm && (
                    <div className="confirm-overlay" onClick={() => setShowEndChatConfirm(false)}>
                        <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                            <p className="confirm-message">{t('Do you want to end this chat?')}</p>
                            <div className="confirm-actions">
                                <button className="confirm-btn confirm-no" onClick={() => setShowEndChatConfirm(false)}>{t('No')}</button>
                                <button className="confirm-btn confirm-yes" onClick={confirmEndChat}>{t('Yes')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Related Queries Modal */}
                {showRelatedQueriesModal && (
                    <div className="confirm-overlay" onClick={() => setShowRelatedQueriesModal(false)}>
                        <div className="confirm-dialog" style={{ maxWidth: '360px', width: '90%' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>💡 {t('Related Queries')}</h3>
                                <button className="icon-btn" onClick={() => setShowRelatedQueriesModal(false)}><X size={16} /></button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    t("How do I deposit funds into my wallet?"),
                                    t("Why was my recent transaction declined?"),
                                    t("How can I withdraw money to my bank account?"),
                                    t("Why is my order execution delayed?"),
                                    t("What are the fees for trading?"),
                                    t("How do I change my account type?"),
                                    t("Where can I see my transaction history?"),
                                    t("How do I set a stop-loss order?"),
                                    t("My wallet balance is not updating."),
                                    t("Can I transfer funds between accounts?")
                                ].map((query, idx) => (
                                    <button key={idx} className="more-menu-item" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'left' }} onClick={() => { handleSendMessage(query); setShowRelatedQueriesModal(false); }}>
                                        {query}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Existing Chat Interface
    return (
        <div className="live-chat-interface-wrapper" style={{ height: 'calc(100vh - 60px)', maxHeight: 'calc(100vh - 60px)' }}>
            <div className="live-chat-interface" style={{ minHeight: 0, flex: 1 }}>
                <div className="chat-sidebar">
                    <div className="sidebar-back-header">
                        <button className="back-btn" onClick={() => setChatStep('options')}>
                            <ArrowLeft size={16} /> {t('Back to Options')}
                        </button>
                    </div>

                    <div className="chat-search-container">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder={t('Search by name')} value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} />
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                        {/* Active Chats */}
                        {filteredChatList.filter(c => c.status !== 'closed' && c.status !== 'ended').length > 0 && (
                            <>
                                <div className="wa-section-heading">{t('Active Chats')}</div>
                                {filteredChatList.filter(c => c.status !== 'closed' && c.status !== 'ended').map(chat => (
                                    <div key={chat.id} className={`wa-chat-item ${chat.id === activeChat ? 'active' : ''}`} onClick={() => handleSelectChat(chat)}>
                                        <div className="wa-avatar-container">
                                            <div className="wa-avatar"><User size={22} /></div>
                                            <span className="wa-status-dot active"></span>
                                        </div>
                                        <div className="wa-chat-info">
                                            <div className="wa-chat-header">
                                                <h4 className="wa-chat-name">{chat.name}</h4>
                                                <span className="wa-chat-time">{chat.time}</span>
                                            </div>
                                            <p className="wa-chat-preview">{chat.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        {/* Past / Closed Chats */}
                        {filteredChatList.filter(c => c.status === 'closed' || c.status === 'ended').length > 0 && (
                            <>
                                <div className="wa-section-heading">{t('Past Chats')}</div>
                                {filteredChatList.filter(c => c.status === 'closed' || c.status === 'ended').map(chat => (
                                    <div key={chat.id} className={`wa-chat-item ${chat.id === activeChat ? 'active' : ''}`} onClick={() => handleSelectChat(chat)}>
                                        <div className="wa-avatar-container">
                                            <div className="wa-avatar"><User size={22} /></div>
                                            <span className="wa-status-dot closed"></span>
                                        </div>
                                        <div className="wa-chat-info">
                                            <div className="wa-chat-header">
                                                <h4 className="wa-chat-name">{chat.name}</h4>
                                                <span className="wa-chat-time">{chat.time}</span>
                                            </div>
                                            <p className="wa-chat-preview">{chat.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        {filteredChatList.length === 0 && (
                            <p style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('No chats found')}</p>
                        )}
                    </div>
                </div>

                <div className="chat-main">
                    <div className="chat-main-header">
                        <div className="current-chat-info">
                            <div className="default-avatar header-default-avatar"><User size={18} /></div>
                            <h3>{selectedChat.name}</h3>
                        </div>
                        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button className="icon-btn search-btn" onClick={() => { setSearchOpen(!searchOpen); setSearchTerm(''); setCurrentMatchIndex(0); }}>
                                {searchOpen ? <X size={18} /> : <Search size={18} />}
                            </button>
                            <div className="more-menu-container">
                                <button className="icon-btn" onClick={() => setShowHeaderMenu(prev => !prev)} title={t('More options')}>
                                    <MoreVertical size={18} />
                                </button>
                                {showHeaderMenu && (
                                    <div className="more-menu-dropdown" onClick={() => setShowHeaderMenu(false)}>
                                        {(activeChatStatus !== 'closed' && activeChatStatus !== 'ended') && (
                                            <button className="more-menu-item danger" onClick={handleEndChat}>
                                                🛑 {t('End Chat')}
                                            </button>
                                        )}
                                        {(activeChatStatus === 'closed' || activeChatStatus === 'ended') && (
                                            <button className="more-menu-item" onClick={handleStartNewAfterClose} style={{ color: '#10b981' }}>
                                                ✚ {t('Start New Chat')}
                                            </button>
                                        )}
                                        <button className="more-menu-item" onClick={() => { setShowRelatedQueriesModal(true); setShowHeaderMenu(false); }}>
                                            💡 {t('Related Queries')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {searchOpen && (
                        <div className="chat-search-bar">
                            <Search size={16} className="bar-search-icon" />
                            <input type="text" placeholder={t('Search in conversation')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                            {searchTerm.trim() && (
                                <div className="search-nav">
                                    <span className="search-count">{matchIndices.length > 0 ? `${currentMatchIndex + 1}/${matchIndices.length}` : '0/0'}</span>
                                    <button className="icon-btn search-nav-btn" onClick={goToPrevMatch} disabled={matchIndices.length === 0}><ChevronUp size={16} /></button>
                                    <button className="icon-btn search-nav-btn" onClick={goToNextMatch} disabled={matchIndices.length === 0}><ChevronDown size={16} /></button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="chat-messages-area" ref={messagesAreaRef}>
                        <div className="date-separator"><span>Today</span></div>

                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
                                {activeChatStatus === 'closed' ? t('Loading history...') : t('No messages yet.')}
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const hasMatch = searchTerm.trim() && msg.text && msg.text.replace(/<br\s*\/?>/gi, ' ').toLowerCase().includes(searchTerm.toLowerCase());
                            if (hasMatch) matchCounter++;
                            const isCurrentMatch = hasMatch && matchCounter === currentMatchIndex;
                            const senderLabel = msg.type === 'user'
                                ? t('You')
                                : msg.type === 'agent'
                                    ? (msg.senderName || t('Agent'))
                                    : null;

                            return (
                                <div key={index} className={`message ${msg.type} ${hasMatch ? 'search-match' : ''} ${isCurrentMatch ? 'current-match' : ''}`}>
                                    {senderLabel && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'block', textAlign: msg.type === 'user' ? 'right' : 'left', paddingRight: msg.type === 'user' ? '4px' : '0', paddingLeft: msg.type !== 'user' ? '4px' : '0' }}>
                                            {senderLabel}
                                        </span>
                                    )}
                                    <div className="message-bubble" dangerouslySetInnerHTML={{ __html: highlightText(msg.text) }} />
                                    <span className="message-time">{msg.time}</span>
                                </div>
                            );
                        })}
                        {typingIndicator && (
                            <div className="message agent" style={{ opacity: 0.7 }}>
                                <div className="message-bubble" style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ display: 'inline-flex', gap: '3px' }}>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                    </span>
                                    {typingIndicator}
                                </div>
                            </div>
                        )}
                    </div>
                    {renderChatInputOrReset()}
                </div>
            </div>

            {/* End Chat Confirm Dialog */}
            {showEndChatConfirm && (
                <div className="confirm-overlay" onClick={() => setShowEndChatConfirm(false)}>
                    <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                        <p className="confirm-message">{t('Do you want to end this chat?')}</p>
                        <div className="confirm-actions">
                            <button className="confirm-btn confirm-no" onClick={() => setShowEndChatConfirm(false)}>{t('No')}</button>
                            <button className="confirm-btn confirm-yes" onClick={confirmEndChat}>{t('Yes')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Related Queries Modal */}
            {showRelatedQueriesModal && (
                <div className="confirm-overlay" onClick={() => setShowRelatedQueriesModal(false)}>
                    <div className="confirm-dialog" style={{ maxWidth: '360px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>💡 {t('Related Queries')}</h3>
                            <button className="icon-btn" onClick={() => setShowRelatedQueriesModal(false)}><X size={16} /></button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                t("How do I deposit funds into my wallet?"),
                                t("Why was my recent transaction declined?"),
                                t("How can I withdraw money to my bank account?"),
                                t("Why is my order execution delayed?"),
                                t("What are the fees for trading?"),
                                t("How do I change my account type?"),
                                t("Where can I see my transaction history?"),
                                t("How do I set a stop-loss order?"),
                                t("My wallet balance is not updating."),
                                t("Can I transfer funds between accounts?")
                            ].map((query, idx) => (
                                <button key={idx} className="more-menu-item" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'left' }} onClick={() => { handleSendMessage(query); setShowRelatedQueriesModal(false); }}>
                                    {query}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}