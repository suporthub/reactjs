import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Filter, Loader2, Download, Calendar, History, TrendingUp } from 'lucide-react';
import './IBClients.css';

export default function IBClients() {
    const { t } = useTranslation();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('portalToken');
        try {
            const response = await fetch('https://v3.livefxhub.com:8444/api/ib/clients', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                setClients(result.data || []);
            } else {
                setError(result.message || t('Failed to load clients'));
            }
        } catch (err) {
            setError(t('A network error occurred. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const filteredClients = clients.filter(client => 
        client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="ib-clients-view">
            <div className="view-header">
                <div className="header-title">
                    <Users size={20} />
                    <h3>{t('My Clients')}</h3>
                </div>
                <div className="header-actions">
                    <div className="search-box-premium">
                        <Search size={16} />
                        <input 
                            type="text" 
                            placeholder={t('Search by name or email...')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="refresh-btn" onClick={fetchClients} disabled={loading}>
                        {loading ? <Loader2 size={16} className="spin" /> : t('Refresh')}
                    </button>
                </div>
            </div>

            <div className="clients-table-container">
                {loading ? (
                    <div className="table-loader">
                        <Loader2 className="spin" size={40} />
                        <p>{t('Fetching your partner network...')}</p>
                    </div>
                ) : error ? (
                    <div className="table-error">
                        <p>{error}</p>
                        <button onClick={fetchClients}>{t('Try Again')}</button>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="no-data-placeholder">
                        <Users size={48} />
                        <p>{t('No clients registered under your network yet.')}</p>
                    </div>
                ) : (
                    <table className="premium-clients-table">
                        <thead>
                            <tr>
                                <th>{t('Full Name')}</th>
                                <th>{t('Email Address')}</th>
                                <th>{t('Account Type')}</th>
                                <th>{t('Currency')}</th>
                                <th>{t('Level')}</th>
                                <th>{t('Registered On')}</th>
                                <th style={{ textAlign: 'center' }}>{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client, index) => (
                                <tr key={index}>
                                    <td style={{ textAlign: 'center' }}>
                                        <span>{client.fullName}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{client.email}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`type-tag ${client.accountType?.toLowerCase()}`}>
                                            {client.accountType}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}><strong>{client.currency || 'USD'}</strong></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="level-badge">{client.level || 1}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="date-cell" style={{ justifyContent: 'center' }}>
                                            {formatDate(client.registeredAt)}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="action-btns-row">
                                            <button className="view-details-btn nav-btn" title={t('Transactions')}>
                                                <History size={14} />
                                            </button>
                                            <button className="view-details-btn trade-btn" title={t('Trading activity')}>
                                                <TrendingUp size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
