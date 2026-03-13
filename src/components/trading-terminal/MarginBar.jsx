import React from 'react';

export default function MarginBar() {
    const data = {
        balance: '$2100.30',
        equity: '$-1261.02',
        margin: '$1439.46',
        freeMargin: '$-2700.48',
        marginLevel: '-87.60%',
        autoCutoff: '90%',
        profit: '$-3361.32',
    };

    const isNegativeProfit = data.profit.includes('-');
    
    // Simulate signal strength (3 bars active for now)
    const activeBars = 3;
    const signalClass = activeBars === 4 ? 'signal-full' : (activeBars >= 2 ? 'signal-medium' : 'signal-low');

    return (
        <div className="margin-bar">
            <div className="margin-bar-items">
                <div className="margin-bar-item">
                    <span className="margin-label">Balance:</span>
                    <span className="margin-value">{data.balance}</span>
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Equity:</span>
                    <span className="margin-value">{data.equity}</span>
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Margin:</span>
                    <span className="margin-value">{data.margin}</span>
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Free Margin:</span>
                    <span className="margin-value">{data.freeMargin}</span>
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Margin Level:</span>
                    <span className="margin-value">{data.marginLevel}</span>
                </div>
                <div className="margin-bar-item">
                    <span className="margin-label">Autocut-off:</span>
                    <span className="margin-value">{data.autoCutoff}</span>
                </div>
            </div>

            <div className="margin-bar-right">
                <div className="margin-profit">
                    <span className="margin-label">Profit:</span>
                    <span className={`margin-value profit-highlight ${isNegativeProfit ? 'negative' : 'positive'}`}>{data.profit}</span>
                </div>
                <div className="margin-connection">
                    <div className={`connection-bars ${signalClass}`}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`bar bar-${i} ${i <= activeBars ? 'active' : ''}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
