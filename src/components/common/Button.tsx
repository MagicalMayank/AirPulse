import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    ...props
}) => {
    const classes = [
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.full : '',
        className
    ].join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
};
