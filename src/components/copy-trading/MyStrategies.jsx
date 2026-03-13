import React from 'react';
import { Users, Eye } from 'lucide-react';
import CreateStrategyWizard from './CreateStrategyWizard';

export default function MyStrategies() {
    const [isWizardOpen, setIsWizardOpen] = React.useState(false);
    return (
        <>
            {!isWizardOpen && (
                <div className="my-strategies-content">
                    <div className="my-strategies-topbar">
                        <div className="my-strategies-tabs">
                            <button className="my-strat-tab active">Active</button>
                            <button className="my-strat-tab">Archived</button>
                        </div>
                        <button className="btn-create-strategy" onClick={() => setIsWizardOpen(true)}>+ Create New Strategy</button>
                    </div>

                    <div className="my-strategies-grid">
                        <div className="my-strat-card">
                            <div className="my-strat-card-header">
                                <span className="strat-try-badge">try</span>
                                <span className="strat-id"># SP1772167226111513</span>
                                <button className="btn-strat-menu">&#8942;</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="provider-icon" style={{ margin: '0 12px 0 0', width: '44px', height: '44px' }}>
                                    <Users size={24} />
                                </div>
                                <h3 className="my-strat-title" style={{ margin: 0 }}>kodidela_111</h3>
                            </div>
                            <div className="my-strat-status-row">
                                <span className="status-public has-tooltip">
                                    Public strategy <span className="info-circle">i</span>
                                    <div className="custom-tooltip">
                                        Anyone can view your strategy, as long as it meets the required conditions.
                                    </div>
                                </span>
                                <span className="status-not-avail has-tooltip">
                                    Not available for investing <span>&#10006;</span>
                                    <div className="custom-tooltip" style={{ width: 'max-content', left: '10%' }}>
                                        <div className="strat-equity-tooltip">
                                            <strong><span style={{ fontSize: '16px' }}>&#9888;</span> Strategy equity</strong>
                                            <span style={{ color: '#dc3545' }}>&lt; 100 USD</span>
                                        </div>
                                    </div>
                                </span>
                            </div>

                            <div className="my-strat-details-grid">
                                <div className="detail-item">
                                    <span className="detail-lbl">Total equity</span>
                                    <span className="detail-val">0.00 USD</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Investors</span>
                                    <span className="detail-val">0</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Strategy equity</span>
                                    <span className="detail-val">0.00 USD</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Invested</span>
                                    <span className="detail-val">0.00 USD</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Performance fee</span>
                                    <span className="detail-val">5%</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Minimum investment</span>
                                    <span className="detail-val">100.00 USD</span>
                                </div>
                            </div>

                            <div className="strat-deposit-hint">
                                To reach equity limit, <a href="#" className="blue-link">please deposit</a> 100.00 USD
                            </div>

                            <div className="strat-card-bottom">
                                <div className="strat-bottom-right">
                                    <span className="start-trade-hint">To start trade</span>
                                    <button className="btn-make-deposit">Make deposit</button>
                                </div>
                            </div>
                        </div>

                        <div className="my-strat-card">
                            <div className="my-strat-card-header">
                                <span className="strat-try-badge">try</span>
                                <span className="strat-id"># SP1772167882234031</span>
                                <button className="btn-strat-menu">&#8942;</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                <div className="provider-icon" style={{ margin: '0 12px 0 0', width: '44px', height: '44px' }}>
                                    <Users size={24} />
                                </div>
                                <h3 className="my-strat-title" style={{ margin: 0 }}>pro_trader_new</h3>
                            </div>

                            <div className="my-strat-status-row">
                                <span className="status-public has-tooltip">
                                    Public strategy <span className="info-circle">i</span>
                                    <div className="custom-tooltip">
                                        Anyone can view your strategy, as long as it meets the required conditions.
                                    </div>
                                </span>
                                <span className="status-not-avail has-tooltip">
                                    Not available for investing <span>&#10006;</span>
                                    <div className="custom-tooltip" style={{ width: 'max-content', left: '10%' }}>
                                        <div className="strat-equity-tooltip">
                                            <strong><span style={{ fontSize: '16px' }}>&#9888;</span> Strategy equity</strong>
                                            <span style={{ color: '#dc3545' }}>&lt; 100 USD</span>
                                        </div>
                                    </div>
                                </span>
                            </div>

                            <div className="my-strat-details-grid">
                                <div className="detail-item">
                                    <span className="detail-lbl">Total equity</span>
                                    <span className="detail-val">0.00 USD</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Investors</span>
                                    <span className="detail-val">0</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Strategy equity</span>
                                    <span className="detail-val">0.00 USD</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Invested</span>
                                    <span className="detail-val">0.00 USD</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Performance fee</span>
                                    <span className="detail-val">5%</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Minimum investment</span>
                                    <span className="detail-val">100.00 USD</span>
                                </div>
                            </div>

                            <div className="strat-deposit-hint">
                                To reach equity limit, <a href="#" className="blue-link">please deposit</a> 100.00 USD
                            </div>

                            <div className="strat-card-bottom">
                                <div className="strat-bottom-right">
                                    <span className="start-trade-hint">To start trade</span>
                                    <button className="btn-make-deposit">Make deposit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isWizardOpen && <CreateStrategyWizard onBack={() => setIsWizardOpen(false)} />}
        </>
    );
}
