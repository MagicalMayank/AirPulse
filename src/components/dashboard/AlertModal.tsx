import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MCD_WARDS } from '../../constants/wards';
import { useAirQuality } from '../../context/AirQualityContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, Plus, X, Globe } from 'lucide-react';
import styles from './AlertModal.module.css';

// Import cleanup utility for debugging
import '../../utils/cleanupAlerts';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose }) => {
    const { sendAlert } = useAirQuality();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [targetType, setTargetType] = useState<'single' | 'multiple' | 'city'>('single');
    const [selectedWards, setSelectedWards] = useState<string[]>([]);

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
    const [category, setCategory] = useState<'pollution' | 'traffic' | 'health'>('pollution');
    const [actionRequired, setActionRequired] = useState(true);
    const [recommendedActions, setRecommendedActions] = useState<string[]>(['']);
    const [durationHours, setDurationHours] = useState(24);

    const handleAddAction = () => {
        setRecommendedActions([...recommendedActions, '']);
    };

    const handleRemoveAction = (index: number) => {
        const newActions = recommendedActions.filter((_, i) => i !== index);
        setRecommendedActions(newActions.length ? newActions : ['']);
    };

    const handleActionChange = (index: number, value: string) => {
        const newActions = [...recommendedActions];
        newActions[index] = value;
        setRecommendedActions(newActions);
    };

    const handleWardToggle = (wardName: string) => {
        if (selectedWards.includes(wardName)) {
            setSelectedWards(selectedWards.filter(w => w !== wardName));
        } else {
            setSelectedWards([...selectedWards, wardName]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + durationHours);

            const wards = targetType === 'city' ? ['all'] : selectedWards;

            const actions = recommendedActions.filter(a => a.trim() !== '');

            const alertData = {
                title,
                message,
                severity,
                category,
                actionRequired,
                recommendedActions: actions,
                expiresAt: expiresAt.toISOString(),
                createdByAuthorityId: user.uid,
                targetRole: 'citizen', // Alerts sent by Authority are targeted at Citizens only
            };

            console.log('[AlertModal] Submitting alerts for wards:', wards);

            if (targetType === 'city') {
                await sendAlert({ ...alertData, wardId: 'all' });
            } else {
                // Sequential processing might be safer for debugging than Promise.all if one fails
                for (const ward of wards) {
                    if (!ward) continue;
                    await sendAlert({ ...alertData, wardId: ward });
                }
            }

            console.log('[AlertModal] Alerts sent successfully');
            onClose();
            // Reset form
            setTitle('');
            setMessage('');
            setSelectedWards([]);
        } catch (error: any) {
            console.error('[AlertModal] Failed to send alerts:', error);
            const errorMessage = error?.message || 'Unknown error';
            alert(`Error sending alerts: ${errorMessage}\n\nPlease check console for details.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Actionable Alert">
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <label className={styles.label}>1. TARGET AUDIENCE</label>
                    <div className={styles.targetTypeGroup}>
                        <button
                            type="button"
                            className={`${styles.targetBtn} ${targetType === 'single' ? styles.activeTarget : ''}`}
                            onClick={() => setTargetType('single')}
                        >
                            <Bell size={16} /> Specific Ward
                        </button>
                        <button
                            type="button"
                            className={`${styles.targetBtn} ${targetType === 'multiple' ? styles.activeTarget : ''}`}
                            onClick={() => setTargetType('multiple')}
                        >
                            <Bell size={16} /> Multiple Wards
                        </button>
                        <button
                            type="button"
                            className={`${styles.targetBtn} ${targetType === 'city' ? styles.activeTarget : ''}`}
                            onClick={() => setTargetType('city')}
                        >
                            <Globe size={16} /> Entire City
                        </button>
                    </div>

                    {targetType !== 'city' && (
                        <div className={styles.wardPicker}>
                            <select
                                className={styles.select}
                                onChange={(e) => {
                                    if (targetType === 'single') {
                                        setSelectedWards([e.target.value]);
                                    } else {
                                        handleWardToggle(e.target.value);
                                    }
                                }}
                                value={targetType === 'single' ? (selectedWards[0] || '') : ''}
                            >
                                <option value="">{targetType === 'single' ? 'Select Ward...' : 'Add Ward...'}</option>
                                {MCD_WARDS.map(w => (
                                    <option key={w.number} value={w.name}>{w.name} ({w.number})</option>
                                ))}
                            </select>

                            {targetType === 'multiple' && selectedWards.length > 0 && (
                                <div className={styles.tagGroup}>
                                    {selectedWards.map(w => (
                                        <span key={w} className={styles.tag}>
                                            {w} <X size={12} onClick={() => handleWardToggle(w)} />
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.grid}>
                    <div className={styles.section}>
                        <label className={styles.label}>2. ALERT DETAILS</label>
                        <input
                            type="text"
                            placeholder="Alert Title (e.g. High Pollution Alert)"
                            className={styles.input}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder="Main message / Background info..."
                            className={styles.textarea}
                            rows={3}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.section}>
                        <label className={styles.label}>3. SEVERITY & CATEGORY</label>
                        <div className={styles.inputGroup}>
                            <select
                                className={styles.select}
                                value={severity}
                                onChange={e => setSeverity(e.target.value as any)}
                            >
                                <option value="low">Low Severity</option>
                                <option value="medium">Medium Severity</option>
                                <option value="high">High Severity</option>
                                <option value="emergency">Emergency (Red Banner)</option>
                            </select>
                            <select
                                className={styles.select}
                                value={category}
                                onChange={e => setCategory(e.target.value as any)}
                            >
                                <option value="pollution">Pollution Related</option>
                                <option value="traffic">Traffic/Congestion</option>
                                <option value="health">Public Health</option>
                            </select>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="actionRequired"
                                checked={actionRequired}
                                onChange={e => setActionRequired(e.target.checked)}
                            />
                            <label htmlFor="actionRequired">Action Required from Citizens</label>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>4. RECOMMENDED ACTIONS (ACTIONABLE GUIDANCE)</label>
                    <div className={styles.actionInputs}>
                        {recommendedActions.map((action, index) => (
                            <div key={index} className={styles.actionInputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Action (e.g. Wear N95 mask)"
                                    className={styles.input}
                                    value={action}
                                    onChange={e => handleActionChange(index, e.target.value)}
                                />
                                <button type="button" onClick={() => handleRemoveAction(index)} className={styles.removeBtn}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddAction} className={styles.addBtn}>
                        <Plus size={14} /> Add Another Action
                    </button>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>5. EXPIRATION</label>
                    <select
                        className={styles.select}
                        value={durationHours}
                        onChange={e => setDurationHours(Number(e.target.value))}
                    >
                        <option value={1}>Expires in 1 Hour</option>
                        <option value={6}>Expires in 6 Hours</option>
                        <option value={12}>Expires in 12 Hours</option>
                        <option value={24}>Expires in 24 Hours</option>
                        <option value={48}>Expires in 48 Hours</option>
                        <option value={168}>Expires in 7 Days</option>
                    </select>
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || !title || (targetType !== 'city' && selectedWards.length === 0)}
                        className={severity === 'emergency' ? styles.emergencySubmit : ''}
                    >
                        {loading ? 'Sending...' : severity === 'emergency' ? '🚨 BROADCAST EMERGENCY ALERT' : 'Send Alert'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
