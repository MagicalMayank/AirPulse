import { useState } from 'react';
import { ClipboardList, BarChart3, Users, Bell, Clock, CheckCircle, ArrowRight, MapPin } from 'lucide-react';
import styles from './AuthorityPanels.module.css';

type TabType = 'actions' | 'analytics' | 'teams';

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

const ActionsTab = () => (
    <>
        {/* Priority Queue */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Priority Queue</span>
                <span className={styles.queueCount}>5 urgent</span>
            </div>
            <div className={styles.actionList}>
                <ActionItem
                    title="Garbage Burning - Okhla"
                    time="Reported 45 mins ago"
                    priority="critical"
                    status="unassigned"
                />
                <ActionItem
                    title="Industrial Smoke - Mayapuri"
                    time="Reported 1 hr ago"
                    priority="high"
                    status="pending"
                />
                <ActionItem
                    title="Construction Dust - Dwarka"
                    time="Reported 2 hrs ago"
                    priority="medium"
                    status="assigned"
                />
            </div>
        </div>

        {/* Recent Resolutions */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Recent Resolutions</span>
                <a href="#" className={styles.viewAllLink}>View All</a>
            </div>
            <div className={styles.resolutionList}>
                <ResolutionItem
                    title="Road Dust - Rajouri Garden"
                    resolvedBy="Team Alpha"
                    time="30 mins ago"
                />
                <ResolutionItem
                    title="Biomass Burning - Rohini"
                    resolvedBy="Team Gamma"
                    time="1 hr ago"
                />
            </div>
        </div>

        {/* Escalation Alerts */}
        <div className={styles.alertCard}>
            <div className={styles.alertHeader}>
                <Bell size={14} color="var(--status-error)" />
                <span>Escalation Required</span>
            </div>
            <p className={styles.alertText}>
                3 complaints pending for over 4 hours in Okhla Phase III. Consider deploying additional resources.
            </p>
            <button className={styles.alertBtn}>Take Action <ArrowRight size={14} /></button>
        </div>
    </>
);

const ActionItem = ({ title, time, priority, status }: {
    title: string;
    time: string;
    priority: 'critical' | 'high' | 'medium';
    status: 'unassigned' | 'pending' | 'assigned';
}) => {
    const priorityColor = priority === 'critical' ? 'var(--status-error)' :
        priority === 'high' ? 'var(--aqi-poor)' : 'var(--status-warning)';
    const statusLabel = status === 'unassigned' ? '⚠️ Unassigned' :
        status === 'pending' ? '🔄 In Progress' : '✅ Assigned';
    return (
        <div className={styles.actionItem} style={{ borderLeftColor: priorityColor }}>
            <div className={styles.actionHeader}>
                <span className={styles.actionTitle}>{title}</span>
                <span className={styles.actionStatus}>{statusLabel}</span>
            </div>
            <div className={styles.actionTime}>
                <Clock size={12} /> {time}
            </div>
        </div>
    );
};

const ResolutionItem = ({ title, resolvedBy, time }: { title: string; resolvedBy: string; time: string }) => (
    <div className={styles.resolutionItem}>
        <CheckCircle size={16} color="var(--status-success)" />
        <div className={styles.resolutionContent}>
            <span className={styles.resolutionTitle}>{title}</span>
            <span className={styles.resolutionMeta}>by {resolvedBy} • {time}</span>
        </div>
    </div>
);

const AnalyticsTab = () => (
    <>
        {/* Resolution Time */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Avg. Resolution Time</span>
                <span className={styles.metricBadge}>This Week</span>
            </div>
            <div className={styles.metricDisplay}>
                <span className={styles.metricValue}>2.4</span>
                <span className={styles.metricUnit}>hours</span>
                <span className={styles.metricChange} style={{ color: 'var(--status-success)' }}>
                    ↓ 18% vs last week
                </span>
            </div>
        </div>

        {/* Complaints by Category */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Complaints by Source</span>
            </div>
            <div className={styles.categoryList}>
                <CategoryBar label="Garbage Burning" value={35} color="var(--source-biomass)" />
                <CategoryBar label="Construction Dust" value={28} color="var(--source-construction)" />
                <CategoryBar label="Traffic/Vehicles" value={22} color="var(--source-traffic)" />
                <CategoryBar label="Industrial" value={15} color="var(--source-industry)" />
            </div>
        </div>

        {/* Ward Performance */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Ward Performance</span>
            </div>
            <div className={styles.wardList}>
                <WardPerformance ward="Saket" resolved={12} pending={2} score={85} />
                <WardPerformance ward="Lajpat Nagar" resolved={8} pending={5} score={62} />
                <WardPerformance ward="Okhla" resolved={5} pending={9} score={36} />
            </div>
        </div>
    </>
);

const CategoryBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={styles.categoryRow}>
        <span className={styles.categoryLabel}>{label}</span>
        <div className={styles.categoryBarTrack}>
            <div className={styles.categoryBarFill} style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <span className={styles.categoryValue}>{value}%</span>
    </div>
);

const WardPerformance = ({ ward, resolved, pending, score }: { ward: string; resolved: number; pending: number; score: number }) => {
    const scoreColor = score >= 70 ? 'var(--status-success)' : score >= 40 ? 'var(--status-warning)' : 'var(--status-error)';
    return (
        <div className={styles.wardItem}>
            <div className={styles.wardInfo}>
                <span className={styles.wardName}>{ward}</span>
                <span className={styles.wardStats}>
                    ✓ {resolved} resolved • ⏳ {pending} pending
                </span>
            </div>
            <div className={styles.wardScore} style={{ color: scoreColor }}>{score}%</div>
        </div>
    );
};

const TeamsTab = () => (
    <>
        {/* Team Overview */}
        <div className={styles.teamOverview}>
            <div className={styles.teamStat}>
                <span className={styles.teamStatValue}>8</span>
                <span className={styles.teamStatLabel}>Total Teams</span>
            </div>
            <div className={styles.teamStat}>
                <span className={styles.teamStatValue} style={{ color: 'var(--aqi-moderate)' }}>5</span>
                <span className={styles.teamStatLabel}>Deployed</span>
            </div>
            <div className={styles.teamStat}>
                <span className={styles.teamStatValue} style={{ color: 'var(--status-success)' }}>3</span>
                <span className={styles.teamStatLabel}>Available</span>
            </div>
        </div>

        {/* Active Deployments */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Active Deployments</span>
            </div>
            <div className={styles.deploymentList}>
                <DeploymentCard
                    team="Team Alpha"
                    location="Okhla Phase III"
                    task="Garbage Burning Investigation"
                    eta="15 mins"
                />
                <DeploymentCard
                    team="Team Beta"
                    location="Mayapuri Industrial"
                    task="Industrial Emission Check"
                    eta="25 mins"
                />
                <DeploymentCard
                    team="Team Gamma"
                    location="Lajpat Nagar"
                    task="Construction Site Inspection"
                    eta="10 mins"
                />
            </div>
        </div>

        {/* Performance */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Team Efficiency (Today)</span>
            </div>
            <div className={styles.efficiencyList}>
                <EfficiencyRow team="Team Alpha" resolutions={5} avgTime="1.8 hrs" />
                <EfficiencyRow team="Team Gamma" resolutions={4} avgTime="2.1 hrs" />
                <EfficiencyRow team="Team Beta" resolutions={3} avgTime="2.5 hrs" />
            </div>
        </div>
    </>
);

const DeploymentCard = ({ team, location, task, eta }: { team: string; location: string; task: string; eta: string }) => (
    <div className={styles.deploymentCard}>
        <div className={styles.deploymentHeader}>
            <span className={styles.deploymentTeam}>{team}</span>
            <span className={styles.deploymentEta}>ETA: {eta}</span>
        </div>
        <div className={styles.deploymentLocation}>
            <MapPin size={12} /> {location}
        </div>
        <div className={styles.deploymentTask}>{task}</div>
    </div>
);

const EfficiencyRow = ({ team, resolutions, avgTime }: { team: string; resolutions: number; avgTime: string }) => (
    <div className={styles.efficiencyRow}>
        <span className={styles.efficiencyTeam}>{team}</span>
        <span className={styles.efficiencyResolutions}>{resolutions} resolved</span>
        <span className={styles.efficiencyTime}>Avg: {avgTime}</span>
    </div>
);
