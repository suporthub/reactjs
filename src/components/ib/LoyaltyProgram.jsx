import React from 'react';
import { Award, Target, Gift, Zap, Users, Wallet, TrendingUp, Calendar, Lock, CheckCircle2 } from 'lucide-react';

export default function LoyaltyProgram({ ibData }) {
    const programs = ibData?.active_loyality_programs || [];

    if (programs.length === 0) {
        return (
            <div className="loyalty-empty-state">
                < Award size={48} />
                <h3>No Active Programs</h3>
                <p>Check back later for new partnership loyalty programs and rewards.</p>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Expiry';
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="loyalty-program-view">
            {programs.map((program) => (
                <div key={program.id} className="loyalty-program-block">
                    <div className="program-header-premium">
                        <div className="title-row">
                            <h3>{program.name}</h3>
                            <div className="program-dates">
                                <Calendar size={14} />
                                <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                            </div>
                        </div>
                        <p>{program.description}</p>
                    </div>

                    <div className="loyalty-roadmap">
                        {program.tasks.map((task, index) => {
                            // Mocking logic: Level 1 is ongoing, others are locked for demo
                            const isCompleted = false;
                            const isCurrent = index === 0;
                            const isLocked = index > 0;

                            return (
                                <div key={task.id} className={`roadmap-node ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}>
                                    <div className="level-indicator">
                                        <div className="lvl-dot">
                                            {isCompleted ? <CheckCircle2 size={16} /> : isLocked ? <Lock size={16} /> : index + 1}
                                        </div>
                                        {index < program.tasks.length - 1 && <div className="lvl-connector"></div>}
                                    </div>
                                    
                                    <div className="roadmap-card">
                                        <div className="card-top">
                                            <div className="task-type-badge">
                                                {task.type === 'referrals' ? <Users size={14} /> :
                                                 task.type === 'deposit' ? <Wallet size={14} /> :
                                                 <TrendingUp size={14} />}
                                                <span>Level {index + 1}</span>
                                            </div>
                                            <div className="reward-tag-premium">
                                                <Gift size={12} />
                                                <span>+{task.reward} {task.reward_type?.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="card-body">
                                            <h4>{task.description}</h4>
                                            <div className="roadmap-progress-wrap">
                                                <div className="progress-labels-refined">
                                                    <span>Target: {task.target} {task.type === 'volume' ? 'Lots' : task.type === 'deposit' ? 'USD' : 'Referrals'}</span>
                                                    <span className={`status-pill ${isLocked ? 'locked' : isCurrent ? 'ongoing' : 'done'}`}>
                                                        {isLocked ? 'Locked' : isCurrent ? 'In Progress' : 'Completed'}
                                                    </span>
                                                </div>
                                                <div className="roadmap-bar">
                                                    <div className="bar-fill" style={{ width: isLocked ? '0%' : '10%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="loyalty-info-notice">
                <div className="notice-content">
                    <Zap size={16} />
                    <p>Complete levels sequentially to unlock the next reward tier. Bonuses are automatically credited to your wallet.</p>
                </div>
            </div>
        </div>
    );
}
