import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, ThumbsUp, ThumbsDown, Clock, Send, X, PlusCircle, CheckCircle2 } from 'lucide-react';
import styles from './SuggestInitiative.module.css';

interface Initiative {
    id: string;
    title: string;
    description: string;
    likes: number;
    dislikes: number;
    timestamp: number;
    rwaName: string;
    status: 'pending' | 'forwarded';
    author: string;
}

const MOCK_INITIATIVES: Initiative[] = [
    {
        id: 'init-1',
        title: 'Solar Street Lights in Block C',
        description: 'Install solar-powered street lights to reduce energy dependency and improve night safety.',
        likes: 42,
        dislikes: 3,
        timestamp: Date.now() - (18 * 60 * 60 * 1000), // 18 hours ago
        rwaName: 'Green Park Extension RWA',
        status: 'pending',
        author: 'Rahul Sharma'
    },
    {
        id: 'init-2',
        title: 'Vertical Garden on Bridge Pillars',
        description: 'Suggesting to the authority to cover the pillars of the nearby flyover with air-purifying plants.',
        likes: 156,
        dislikes: 12,
        timestamp: Date.now() - (36 * 60 * 60 * 1000), // 36 hours ago
        rwaName: 'Green Park Extension RWA',
        status: 'forwarded',
        author: 'Anjali Gupta'
    },
    {
        id: 'init-3',
        title: 'EV Charging Points in Community Center',
        description: 'Common area EV chargers to encourage resident transition to electric vehicles.',
        likes: 89,
        dislikes: 5,
        timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        rwaName: 'South Ex Ward RWA',
        status: 'pending',
        author: 'Vikram Singh'
    }
];

export const SuggestInitiative: React.FC = () => {
    const [isRwaVisible, setIsRwaVisible] = useState(false);
    const [initiatives, setInitiatives] = useState<Initiative[]>(MOCK_INITIATIVES);
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({});

    // Current user's RWA (mocked)
    const userRwa = 'Green Park Extension RWA';

    const filteredInitiatives = useMemo(() => {
        if (!isRwaVisible) return [];
        return initiatives.filter(init => init.rwaName === userRwa);
    }, [isRwaVisible, initiatives, userRwa]);

    const handleVote = (id: string, type: 'like' | 'dislike') => {
        if (userVotes[id] === type) return;

        setInitiatives(prev => prev.map(init => {
            if (init.id === id) {
                const updatedLikes = type === 'like' ? init.likes + 1 : (userVotes[id] === 'like' ? init.likes - 1 : init.likes);
                const updatedDislikes = type === 'dislike' ? init.dislikes + 1 : (userVotes[id] === 'dislike' ? init.dislikes - 1 : init.dislikes);
                return { ...init, likes: updatedLikes, dislikes: updatedDislikes };
            }
            return init;
        }));

        setUserVotes(prev => ({ ...prev, [id]: type }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newDesc) return;

        const newInitiative: Initiative = {
            id: `init-${Date.now()}`,
            title: newTitle,
            description: newDesc,
            likes: 1,
            dislikes: 0,
            timestamp: Date.now(),
            rwaName: userRwa,
            status: 'pending',
            author: 'You'
        };

        setInitiatives([newInitiative, ...initiatives]);
        setUserVotes(prev => ({ ...prev, [newInitiative.id]: 'like' }));
        setNewTitle('');
        setNewDesc('');
        setShowModal(false);
    };

    const formatTimeLeft = (timestamp: number) => {
        const passed = Date.now() - timestamp;
        const total = 24 * 60 * 60 * 1000;
        const left = total - passed;

        if (left <= 0) return 'Voting Closed';
        
        const hours = Math.floor(left / (1000 * 60 * 60));
        const minutes = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m left`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Lightbulb size={20} color="#00ff85" className={styles.iconImg} />
                    <h4 className={styles.title}>SUGGEST INITIATIVE</h4>
                </div>
                
                <div className={styles.rwaToggleGroup}>
                    <span className={styles.toggleLabel}>RWA Hub</span>
                    <label className={styles.switch}>
                        <input 
                            type="checkbox" 
                            checked={isRwaVisible} 
                            onChange={(e) => setIsRwaVisible(e.target.checked)} 
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>

            <div className={styles.suggestBox}>
                <p className={styles.suggestPrompt}>
                    Got an idea to improve your local air quality?
                </p>
                <button className={styles.suggestBtn} onClick={() => setShowModal(true)}>
                    <PlusCircle size={14} />
                    New Suggestion
                </button>
            </div>

            {isRwaVisible && (
                <div className={styles.list}>
                    {filteredInitiatives.length > 0 ? (
                        filteredInitiatives.map(init => (
                            <div key={init.id} className={styles.initiativeCard}>
                                <div className={styles.initiativeHeader}>
                                    <h5 className={styles.initiativeTitle}>{init.title}</h5>
                                    <span className={`${styles.statusBadge} ${init.status === 'forwarded' ? styles.statusForwarded : styles.statusPending}`}>
                                        {init.status === 'forwarded' ? 'Sent to Authority' : 'Consensus Stage'}
                                    </span>
                                </div>
                                <p className={styles.initiativeDesc}>{init.description}</p>
                                <div className={styles.initiativeFooter}>
                                    <div className={styles.votes}>
                                        <button 
                                            className={`${styles.voteBtn} ${userVotes[init.id] === 'like' ? styles.voted : ''}`}
                                            onClick={() => handleVote(init.id, 'like')}
                                        >
                                            <ThumbsUp size={12} fill={userVotes[init.id] === 'like' ? 'currentColor' : 'none'} />
                                            {init.likes}
                                        </button>
                                        <button 
                                            className={`${styles.voteBtn} ${userVotes[init.id] === 'dislike' ? styles.votedDislike : ''}`}
                                            onClick={() => handleVote(init.id, 'dislike')}
                                        >
                                            <ThumbsDown size={12} fill={userVotes[init.id] === 'dislike' ? 'currentColor' : 'none'} />
                                            {init.dislikes}
                                        </button>
                                    </div>
                                    <div className={styles.timeLeft}>
                                        <Clock size={12} />
                                        {init.status === 'forwarded' ? 'Approved by Majority' : formatTimeLeft(init.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>No initiatives in your RWA yet. Be the first!</div>
                    )}
                </div>
            )}

            {showModal && (
                <div className={styles.overlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h4 className={styles.modalTitle}>Suggest Local Initiative</h4>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Title</label>
                                <input 
                                    className={styles.input} 
                                    placeholder="e.g. Park Air Purifiers" 
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Description</label>
                                <textarea 
                                    className={styles.textarea} 
                                    placeholder="Explain how this helps the community..." 
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                <Send size={16} style={{ marginRight: '8px' }} />
                                Submit to RWA
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
