import React from 'react';
import { TrendingUp, Clock, DollarSign, Activity } from 'lucide-react';
import './tradingNews.css';
import { useTranslation } from 'react-i18next';

const newsItems = [
    {
        id: 1,
        title: "Bitcoin Surges Past $60K Amid Institutional Buying",
        summary: "Major financial institutions continue to accumulate Bitcoin, driving the price past resistance levels.",
        category: "Crypto",
        time: "2 hours ago",
        icon: <TrendingUp size={18} className="news-icon crypto" />,
        readTime: "3 min read"
    },
    {
        id: 2,
        title: "Forex: USD Strengthens Ahead of NFP Data",
        summary: "The US Dollar index climbs as traders anticipate strong non-farm payroll numbers tomorrow.",
        category: "Forex",
        time: "4 hours ago",
        icon: <DollarSign size={18} className="news-icon forex" />,
        readTime: "5 min read"
    },
    {
        id: 3,
        title: "Global Markets Update: Tech Stocks Rebound",
        summary: "Following yesterday's dip, major technology stocks show strong recovery in early trading.",
        category: "Stocks",
        time: "6 hours ago",
        icon: <Activity size={18} className="news-icon stocks" />,
        readTime: "4 min read"
    },
    {
        id: 4,
        title: "Ethereum Poised for Next Major Network Upgrade",
        summary: "Developers prepare for the upcoming hard fork promising lower gas fees and better scaling.",
        category: "Crypto",
        time: "7 hours ago",
        icon: <TrendingUp size={18} className="news-icon crypto" />,
        readTime: "6 min read"
    },
    {
        id: 5,
        title: "EUR/GBP Volatility Spikes Post ECB Remarks",
        summary: "European Central Bank hints at maintaining higher rates, causing brief volatility in European pairs.",
        category: "Forex",
        time: "8 hours ago",
        icon: <DollarSign size={18} className="news-icon forex" />,
        readTime: "5 min read"
    }
];
export default function TradingNews() {
    const { t } = useTranslation();
    return (
        <div className="trading-news-container">
            <div className="news-header">
                <h2>{t('Market News')}</h2>
            </div>

            <div className="news-marquee">
                <div className="news-track">
                    {/* Render twice for continuous scroll effect */}
                    {[...newsItems, ...newsItems].map((news, index) => (
                        <div key={`${news.id}-${index}`} className="news-card">
                            <div className="news-card-header">
                                <span className={`news-category ${news.category.toLowerCase()}`}>
                                    {news.icon}
                                    {news.category}
                                </span>
                                <div className="news-meta">
                                    <Clock size={14} />
                                    <span>{news.time}</span>
                                </div>
                            </div>

                            <h3 className="news-title">{news.title}</h3>
                            <p className="news-summary">{news.summary}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
