import React, { useMemo } from 'react';
import styles from './AnalystPanels.module.css';

interface DataPoint {
    timestamp: string;
    value: number;
}

interface TrendChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
    className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    data,
    height = 100,
    color = 'var(--brand-secondary)',
    className
}) => {
    // Process data for bar chart rendering
    const { bars } = useMemo(() => {
        if (!data || data.length === 0) {
            return { bars: [] };
        }

        const width = 300; // SVG viewBox width
        const values = data.map(d => d.value);
        const min = Math.min(...values) * 0.8;
        const max = Math.max(...values) * 1.1;
        const range = max - min || 1;

        // Calculate bar dimensions
        const barCount = data.length;
        const gap = 2;
        const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

        const barData = data.map((d, i) => {
            const barHeight = ((d.value - min) / range) * (height - 10);
            const x = i * (barWidth + gap);
            const y = height - barHeight;
            return {
                x,
                y,
                width: barWidth,
                height: barHeight,
                value: d.value,
                timestamp: d.timestamp
            };
        });

        return { bars: barData };
    }, [data, height]);

    if (!data.length) {
        return <div className={styles.chartPlaceholder}>No data available</div>;
    }

    const chartId = `barGradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg viewBox={`0 0 300 ${height}`} className={`${styles.trendChart} ${className || ''}`} preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1={height * 0.25} x2="300" y2={height * 0.25} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <line x1="0" y1={height * 0.5} x2="300" y2={height * 0.5} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <line x1="0" y1={height * 0.75} x2="300" y2={height * 0.75} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

            {/* Definitions for gradient */}
            <defs>
                <linearGradient id={chartId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="1" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                </linearGradient>
            </defs>

            {/* Bars */}
            {bars.map((bar, i) => (
                <rect
                    key={i}
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={`url(#${chartId})`}
                    rx={Math.min(2, bar.width / 2)}
                    ry={Math.min(2, bar.width / 2)}
                    style={{ transition: 'height 0.3s ease, y 0.3s ease' }}
                />
            ))}

            {/* Highlight last bar */}
            {bars.length > 0 && (
                <rect
                    x={bars[bars.length - 1].x}
                    y={bars[bars.length - 1].y}
                    width={bars[bars.length - 1].width}
                    height={bars[bars.length - 1].height}
                    fill={color}
                    rx={Math.min(2, bars[bars.length - 1].width / 2)}
                    ry={Math.min(2, bars[bars.length - 1].width / 2)}
                    opacity={0.9}
                />
            )}
        </svg>
    );
};
