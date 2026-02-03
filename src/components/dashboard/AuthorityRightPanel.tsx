/**
 * AuthorityRightPanel - Complaint Management for Authorities
 * 
 * FEATURES:
 * - View all complaints in real-time
 * - Collapsible Stack Design (Top 3)
 * - View All Drawer for full complaint list
 * - Update complaint status (Pending -> In Progress -> Resolved)
 */

import { useState, useEffect } from 'react';
import { ClipboardList, BarChart3, Users, Bell, MapPin, Loader2, ExternalLink, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './AuthorityPanels.module.css';
import { useAirQuality } from '../../context/AirQualityContext';
import type { Complaint } from '../../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type TabType = 'actions' | 'analytics' | 'teams';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'resolved';

import { sendEmailNotification } from '../../services/emailService';

export const AuthorityRightPanel = () => {
    const [activeTab, setActiveTab] = useState<TabType>('actions');

    return (
        <div className={styles.panelContainer}>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'actions' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('actions')}
                >
                    <ClipboardList size={14} />
                    Actions
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <BarChart3 size={14} />
                    Analytics
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'teams' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('teams')}
                >
                    <Users size={14} />
                    Teams
                </button>
            </div>

            {activeTab === 'actions' && <ActionsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'teams' && <TeamsTab />}
        </div>
    );
};

const ActionsTab = () => {
    const { complaints, complaintsLoading: loading, complaintsError: error, refreshComplaints, updateComplaintStatus, setLayerFilter } = useAirQuality();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isExpanded, setIsExpanded] = useState(false);

    // Sync filter with map visibility - update complaintStatusFilter in context
    useEffect(() => {
        setLayerFilter('complaintStatusFilter', statusFilter);
        // Also enable resolved visibility when filter is 'resolved'
        setLayerFilter('showResolvedComplaints', statusFilter === 'resolved');
    }, [statusFilter, setLayerFilter]);

    const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'in_progress' | 'resolved' | 'invalid') => {
        await updateComplaintStatus(id, newStatus);

        // Trigger Email Notification
        const complaint = complaints.find(c => c.id === id);
        if (complaint && complaint.user_email) {
            console.log('[Authority] Sending status update email to:', complaint.user_email);
            await sendEmailNotification({
                to_email: complaint.user_email,
                to_name: 'Citizen', // We don't have the name stored in complaint yet, defaulted.
                complaint_id: id.substring(0, 8),
                location: complaint.location_text || 'Delhi',
                ward_name: complaint.ward_name || 'Delhi NCR',
                pollution_type: complaint.pollution_type || 'Report',
                status: newStatus.replace('_', ' ').toUpperCase(),
                timestamp: new Date().toLocaleString(),
                update_type: 'status_changed',
                description: complaint.description
            });
        }
    };

    const handleGrantPoints = async (complaint: Complaint, points: number) => {
        console.log('[Authority] Granting', points, 'PulseCoins to user:', complaint.user_id);

        try {
            // Direct Firestore update to user's profile
            const userDocRef = doc(db, 'users', complaint.user_id);
            const userDoc = await getDoc(userDocRef);

            const currentBalance = userDoc.exists() ? (userDoc.data()?.pulseCoins || 0) : 0;
            const newBalance = currentBalance + points;

            await setDoc(userDocRef, { pulseCoins: newBalance }, { merge: true });
            console.log('[Authority] Updated PulseCoins:', currentBalance, '->', newBalance);
        } catch (err) {
            console.error('[Authority] Failed to update PulseCoins:', err);
        }

        // Send points awarded email notification
        if (complaint.user_email) {
            await sendEmailNotification({
                to_email: complaint.user_email,
                to_name: 'Citizen',
                complaint_id: complaint.id.substring(0, 8),
                location: complaint.location_text || 'Delhi',
                ward_name: complaint.ward_name || 'Delhi NCR',
                pollution_type: complaint.pollution_type || 'Report',
                status: `+${points} PULSECOINS AWARDED`,
                timestamp: new Date().toLocaleString(),
                update_type: 'points_awarded',
                description: `Your pollution report has been verified! You earned ${points} PulseCoins. Visit the Marketplace to redeem eco-friendly rewards.`
            });
        }
    };

    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--status-error)' }}>
            <p style={{ fontSize: '0.85rem' }}>Failed to load complaints</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{error}</p>
            <button
                onClick={() => refreshComplaints()}
                style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    cursor: 'pointer',
                    fontWeight: 600
                }}
            >
                Retry
            </button>
        </div>
    );

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className={styles.spinner} /></div>;

    const displayComplaints = statusFilter === 'all'
        ? complaints.filter(c => c.status !== 'resolved' && c.status !== 'invalid')
        : complaints.filter(c => c.status === statusFilter);

    return (
        <>
            <div className={styles.filterBar}>
                <Filter size={14} />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={styles.filterSelect}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        {statusFilter === 'resolved' ? 'Resolved Reports' : 'Live Complaints'} ({displayComplaints.length})
                    </span>
                </div>
                <div className={styles.actionList}>
                    {displayComplaints.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                            No {statusFilter === 'resolved' ? 'resolved' : 'active'} complaints
                        </p>
                    ) : (
                        <>
                            {(isExpanded ? displayComplaints : displayComplaints.slice(0, 3)).map(complaint => (
                                <ActionItem
                                    key={complaint.id}
                                    complaint={complaint}
                                    onUpdateStatus={handleUpdateStatus}
                                    onGrantPoints={handleGrantPoints}
                                />
                            ))}

                            {displayComplaints.length > 3 && (
                                <button
                                    className={styles.viewAllBtn}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? (
                                        <><ChevronUp size={14} /> Show Less</>
                                    ) : (
                                        <><ChevronDown size={14} /> View All ({displayComplaints.length})</>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={styles.alertCard}>
                <div className={styles.alertHeader}>
                    <Bell size={14} color="var(--status-error)" />
                    <span>System Insight</span>
                </div>
                <p className={styles.alertText}>
                    Monitor real-time reports and update status to keep citizens informed.
                </p>
            </div>
        </>
    );
};

const POINTS_PER_VERIFIED_REPORT = 100;

const ActionItem = ({ complaint, onUpdateStatus, onGrantPoints }: {
    complaint: Complaint;
    onUpdateStatus: (id: string, status: 'pending' | 'in_progress' | 'resolved' | 'invalid') => void;
    onGrantPoints?: (complaint: Complaint, points: number) => Promise<void>;
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const formatPollutionType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const priorityColor = complaint.pollution_type === 'garbage_burning' || complaint.pollution_type === 'industrial_smoke'
        ? 'var(--status-error)'
        : 'var(--status-warning)';

    const getStatusLabel = () => {
        switch (complaint.status) {
            case 'pending': return 'Pending';
            case 'in_progress': return 'In Progress';
            case 'resolved': return 'Resolved';
            case 'invalid': return 'Invalid';
            default: return complaint.status;
        }
    };

    const getStatusColor = () => {
        switch (complaint.status) {
            case 'in_progress': return 'var(--aqi-moderate)';
            case 'resolved': return 'var(--status-success)';
            case 'invalid': return 'var(--status-error)';
            default: return 'var(--text-secondary)';
        }
    };

    const nextStatus = complaint.status === 'pending' ? 'in_progress' : 'resolved';
    const nextStatusLabel = nextStatus === 'in_progress' ? 'In Progress' : 'Resolved';

    const handleStatusUpdate = async (newStatus: 'pending' | 'in_progress' | 'resolved' | 'invalid') => {
        setIsUpdating(true);

        // ATOMIC SEQUENCE: 1. Update Status → 2. Grant Points → 3. Email (inside handleGrantPoints)
        // First update the complaint status
        await onUpdateStatus(complaint.id, newStatus);

        // Grant points ONLY when successfully moving from pending to in_progress (verification)
        if (complaint.status === 'pending' && newStatus === 'in_progress' && onGrantPoints) {
            await onGrantPoints(complaint, POINTS_PER_VERIFIED_REPORT);
        }

        setIsUpdating(false);
        setShowDetails(false);
    };

    const handleMarkInvalid = async () => {
        setIsUpdating(true);
        await onUpdateStatus(complaint.id, 'invalid');
        setIsUpdating(false);
        setShowDetails(false);
    };

    // Don't show action buttons for already resolved/invalid complaints
    const showActionButtons = complaint.status !== 'resolved' && complaint.status !== 'invalid';

    return (
        <>
            <div className={styles.actionItem} style={{ borderLeftColor: priorityColor }}>
                <div className={styles.actionHeader}>
                    <span className={styles.actionTitle}>{formatPollutionType(complaint.pollution_type)}</span>
                    <span className={styles.actionStatus} style={{ color: getStatusColor() }}>
                        {getStatusLabel()}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className={styles.actionTime} style={{ marginBottom: '0.25rem' }}>
                            <MapPin size={12} /> {complaint.location_text}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>{complaint.description}</p>
                    </div>
                    {complaint.photo_url && (
                        <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer" className={styles.photoThumb}>
                            <img src={complaint.photo_url} alt="Proof" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            <ExternalLink size={10} className={styles.photoLinkIcon} />
                        </a>
                    )}
                </div>
                {showActionButtons && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className={styles.viewBtn} onClick={() => setShowDetails(true)}>View</button>
                        <button className={styles.statusUpdateBtn} onClick={() => handleStatusUpdate(nextStatus)} disabled={isUpdating}>
                            {isUpdating ? <Loader2 size={12} className={styles.spinner} /> : `Move to ${nextStatusLabel}`}
                        </button>
                    </div>
                )}
            </div>

            {showDetails && (
                <div className={styles.modalBackdrop} onClick={() => setShowDetails(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{formatPollutionType(complaint.pollution_type)}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {complaint.status === 'pending' && (
                                    <button
                                        onClick={handleMarkInvalid}
                                        disabled={isUpdating}
                                        style={{
                                            background: 'var(--status-error)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Mark Invalid
                                    </button>
                                )}
                                <button onClick={() => setShowDetails(false)} className={styles.modalClose}>×</button>
                            </div>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>ID</span>
                                <span className={styles.detailValue}>{complaint.id}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Location</span>
                                <span className={styles.detailValue}>{complaint.location_text}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Description</span>
                                <span className={styles.detailValue}>{complaint.description}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Status</span>
                                <span className={styles.detailValue} style={{ color: getStatusColor() }}>
                                    {getStatusLabel()}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Submitted</span>
                                <span className={styles.detailValue}>{new Date(complaint.created_at).toLocaleString()}</span>
                            </div>
                            {complaint.photo_url && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Photo Evidence</span>
                                    <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer">
                                        <img src={complaint.photo_url} alt="Evidence" style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', marginTop: '0.5rem' }} />
                                    </a>
                                </div>
                            )}

                            {/* Point notification for pending complaints */}
                            {complaint.status === 'pending' && (
                                <div style={{
                                    background: 'rgba(0, 200, 151, 0.1)',
                                    border: '1px solid var(--status-success)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    marginTop: '1rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--status-success)',
                                }}>
                                    ✨ Moving to "In Progress" will verify this report and award <strong>{POINTS_PER_VERIFIED_REPORT} PulseCoins</strong> to the citizen.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const AnalyticsTab = () => {
    const { complaints } = useAirQuality();
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

    const categoryCounts: Record<string, number> = {};
    complaints.forEach(c => {
        const type = c.pollution_type || 'unknown';
        categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });

    const categoryPercentages = Object.entries(categoryCounts).map(([label, count]) => ({
        label: label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
        color: getCategoryColor(label)
    }));

    return (
        <>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Resolution Stats</span>
                    <span className={styles.metricBadge}>All Time</span>
                </div>
                <div className={styles.metricDisplay}>
                    <span className={styles.metricValue}>{resolvedComplaints}</span>
                    <span className={styles.metricUnit}>/ {totalComplaints} resolved</span>
                    <span className={styles.metricChange} style={{ color: 'var(--status-success)' }}>
                        {totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0}% completion rate
                    </span>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Complaints by Source</span>
                </div>
                <div className={styles.categoryList}>
                    {categoryPercentages.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>No data yet</p>
                    ) : (
                        categoryPercentages.map(cat => (
                            <CategoryBar key={cat.label} label={cat.label} value={cat.value} color={cat.color} />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

const getCategoryColor = (type: string): string => {
    const colors: Record<string, string> = {
        'garbage_burning': 'var(--source-biomass)',
        'construction_dust': 'var(--source-construction)',
        'vehicle_emission': 'var(--source-traffic)',
        'industrial_smoke': 'var(--source-industry)',
    };
    return colors[type] || '#888';
};

const CategoryBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={styles.categoryRow}>
        <span className={styles.categoryLabel}>{label}</span>
        <div className={styles.categoryBarTrack}>
            <div className={styles.categoryBarFill} style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <span className={styles.categoryValue}>{value}%</span>
    </div>
);

const TeamsTab = () => {
    const { complaints, deployedTeams, deployTeam, removeDeployedTeam } = useAirQuality();
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const AVAILABLE_TEAMS = [
        { name: 'Team Alpha', specialization: 'Industrial & Burning' },
        { name: 'Team Beta', specialization: 'Vehicle Emissions' },
        { name: 'Team Gamma', specialization: 'Construction Dust' },
        { name: 'Team Delta', specialization: 'General Inspection' },
    ];

    const getAvailableTeams = () => {
        const deployedNames = new Set(deployedTeams.map(t => t.teamName));
        return AVAILABLE_TEAMS.filter(t => !deployedNames.has(t.name));
    };

    const pendingComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'in_progress');

    const handleDeploy = (teamName: string) => {
        if (!selectedComplaint) return;
        if (!selectedComplaint.latitude || !selectedComplaint.longitude) {
            alert('Cannot deploy - complaint has no location coordinates');
            return;
        }
        deployTeam(
            teamName,
            selectedComplaint.ward_name || selectedComplaint.location_text || 'Unknown Ward',
            selectedComplaint.latitude,
            selectedComplaint.longitude,
            selectedComplaint.id
        );
        setShowDeployModal(false);
        setSelectedComplaint(null);
    };

    return (
        <>
            <div className={styles.teamOverview}>
                <div className={styles.teamStat}>
                    <span className={styles.teamStatValue}>{AVAILABLE_TEAMS.length}</span>
                    <span className={styles.teamStatLabel}>Total Teams</span>
                </div>
                <div className={styles.teamStat}>
                    <span className={styles.teamStatValue} style={{ color: 'var(--aqi-moderate)' }}>{deployedTeams.length}</span>
                    <span className={styles.teamStatLabel}>Deployed</span>
                </div>
                <div className={styles.teamStat}>
                    <span className={styles.teamStatValue} style={{ color: 'var(--status-success)' }}>{getAvailableTeams().length}</span>
                    <span className={styles.teamStatLabel}>Available</span>
                </div>
            </div>

            {/* Deploy to Complaint Button */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Deploy Team to Complaint</span>
                </div>
                <div className={styles.deploymentList}>
                    {pendingComplaints.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                            No active complaints to deploy to
                        </p>
                    ) : (
                        pendingComplaints.slice(0, 5).map(complaint => {
                            const isDeployed = deployedTeams.some(t => t.complaintId === complaint.id);
                            return (
                                <div key={complaint.id} className={styles.deploymentCard} style={{ opacity: isDeployed ? 0.6 : 1 }}>
                                    <div className={styles.deploymentHeader}>
                                        <span className={styles.deploymentTeam}>
                                            {complaint.pollution_type?.replace(/_/g, ' ')}
                                        </span>
                                        {isDeployed ? (
                                            <span style={{ color: 'var(--status-success)', fontSize: '0.7rem' }}>✓ Deployed</span>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedComplaint(complaint); setShowDeployModal(true); }}
                                                style={{
                                                    background: 'var(--brand-primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Deploy
                                            </button>
                                        )}
                                    </div>
                                    <div className={styles.deploymentLocation}>
                                        <MapPin size={12} /> {complaint.ward_name || complaint.location_text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Active Deployments */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Active Deployments ({deployedTeams.length})</span>
                </div>
                <div className={styles.deploymentList}>
                    {deployedTeams.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                            No teams currently deployed
                        </p>
                    ) : (
                        deployedTeams.map(team => (
                            <div key={team.id} className={styles.deploymentCard}>
                                <div className={styles.deploymentHeader}>
                                    <span className={styles.deploymentTeam}>🚔 {team.teamName}</span>
                                    <button
                                        onClick={() => removeDeployedTeam(team.id)}
                                        style={{
                                            background: 'var(--status-error)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Recall
                                    </button>
                                </div>
                                <div className={styles.deploymentLocation}>
                                    <MapPin size={12} /> {team.wardName}
                                </div>
                                <div className={styles.deploymentTask}>
                                    Deployed: {new Date(team.deployedAt).toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Deploy Modal */}
            {showDeployModal && selectedComplaint && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        minWidth: '300px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Select Team to Deploy</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                            Deploying to: {selectedComplaint.ward_name || selectedComplaint.location_text}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {getAvailableTeams().map(team => (
                                <button
                                    key={team.name}
                                    onClick={() => handleDeploy(team.name)}
                                    style={{
                                        background: 'var(--bg-element)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <strong>{team.name}</strong>
                                    <br />
                                    <small style={{ color: 'var(--text-secondary)' }}>{team.specialization}</small>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { setShowDeployModal(false); setSelectedComplaint(null); }}
                            style={{
                                marginTop: '1rem',
                                width: '100%',
                                background: 'none',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
