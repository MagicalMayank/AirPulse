import React, { useMemo } from 'react';
import styles from './AnalystPanels.module.css';

interface DataPoint {
    timestamp: string;
    value: number;
}

interface LineChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
    secondaryColor?: string;
    showArea?: boolean;
    showPoints?: boolean;
    className?: string;
}

// Generate smooth curve path using Catmull-Rom spline
function generateSmoothPath(
    points: { x: number; y: number }[],
    tension: number = 0.3
): string {
    if (points.length < 2) return '';

    const path: string[] = [];
    path.push(`M ${points[0].x},${points[0].y}`);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        // Calculate control points for cubic bezier
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;

        path.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }

    return path.join(' ');
}

export const LineChart: React.FC<LineChartProps> = ({
    data,
    height = 140,
    color = '#8B5CF6', // Purple default
    secondaryColor = '#06B6D4', // Cyan secondary
    showArea = true,
    showPoints = true,
    className
}) => {
    const width = 400;
    const padding = { top: 20, right: 20, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const { points, areaPath, linePath, yLabels } = useMemo(() => {
        if (!data || data.length === 0) {
            return { points: [], areaPath: '', linePath: '', maxVal: 0, minVal: 0, yLabels: [] };
        }

        const values = data.map(d => d.value);
        const min = Math.min(...values) * 0.9;
        const max = Math.max(...values) * 1.1;
        const range = max - min || 1;

        // Create points
        const pts = data.map((d, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartWidth,
            y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
            value: d.value,
            timestamp: d.timestamp
        }));

        // Generate smooth line path
        const line = generateSmoothPath(pts.map(p => ({ x: p.x, y: p.y })));

        // Generate area path (closed shape)
        const area = line +
            ` L ${pts[pts.length - 1].x},${height - padding.bottom}` +
            ` L ${pts[0].x},${height - padding.bottom} Z`;

        // Y-axis labels
        const labels = [
            { value: Math.round(max), y: padding.top },
            { value: Math.round((max + min) / 2), y: padding.top + chartHeight / 2 },
            { value: Math.round(min), y: padding.top + chartHeight }
        ];

        return { points: pts, areaPath: area, linePath: line, maxVal: max, minVal: min, yLabels: labels };
    }, [data, height, chartHeight, chartWidth, padding.left, padding.top, padding.bottom]);

    if (!data.length) {
        return <div className={styles.chartPlaceholder}>No data available</div>;
    }

    const chartId = `lineGradient-${Math.random().toString(36).substr(2, 9)}`;
    const areaGradientId = `areaGradient-${chartId}`;
    const lineGradientId = `lineGradient-${chartId}`;

    // Get current value (last point)
    const currentPoint = points[points.length - 1];
    const currentValue = currentPoint?.value || 0;

    return (
        <div className={styles.lineChartContainer}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className={`${styles.lineChart} ${className || ''}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Area gradient - vertical fade */}
                    <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="50%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>

                    {/* Line gradient - horizontal color transition */}
                    <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={secondaryColor} />
                        <stop offset="40%" stopColor={color} />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id={`glow-${chartId}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75].map((pos, i) => (
                    <line
                        key={i}
                        x1={padding.left}
                        y1={padding.top + chartHeight * pos}
                        x2={width - padding.right}
                        y2={padding.top + chartHeight * pos}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Y-axis labels */}
                {yLabels.map((label, i) => (
                    <text
                        key={i}
                        x={padding.left - 5}
                        y={label.y + 4}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="9"
                        textAnchor="end"
                    >
                        {label.value}
                    </text>
                ))}

                {/* Filled area under curve */}
                {showArea && (
                    <path
                        d={areaPath}
                        fill={`url(#${areaGradientId})`}
                        style={{ transition: 'all 0.5s ease' }}
                    />
                )}

                {/* Main line with gradient */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={`url(#${lineGradientId})`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#glow-${chartId})`}
                    style={{ transition: 'all 0.5s ease' }}
                />

                {/* Current value indicator */}
                {showPoints && currentPoint && (
                    <g>
                        {/* Outer glow */}
                        <circle
                            cx={currentPoint.x}
                            cy={currentPoint.y}
                            r="8"
                            fill={color}
                            opacity="0.3"
                        />
                        {/* Inner point */}
                        <circle
                            cx={currentPoint.x}
                            cy={currentPoint.y}
                            r="4"
                            fill="#fff"
                            stroke={color}
                            strokeWidth="2"
                        />
                        {/* Value label box */}
                        <rect
                            x={currentPoint.x - 20}
                            y={currentPoint.y - 28}
                            width="40"
                            height="18"
                            rx="4"
                            fill="rgba(139, 92, 246, 0.9)"
                        />
                        <text
                            x={currentPoint.x}
                            y={currentPoint.y - 16}
                            fill="#fff"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            {Math.round(currentValue)}
                        </text>
                    </g>
                )}

                {/* X-axis time labels */}
                {points.length > 0 && (
                    <>
                        <text
                            x={points[0].x}
                            y={height - 8}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            textAnchor="start"
                        >
                            {new Date(points[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </text>
                        <text
                            x={points[Math.floor(points.length / 2)].x}
                            y={height - 8}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            textAnchor="middle"
                        >
                            {new Date(points[Math.floor(points.length / 2)].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </text>
                        <text
                            x={points[points.length - 1].x}
                            y={height - 8}
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            textAnchor="end"
                        >
                            Now
                        </text>
                    </>
                )}
            </svg>
        </div>
    );
};
