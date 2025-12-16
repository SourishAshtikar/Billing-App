import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            ...styles
        }} className={className}>
            {title && (
                <h3 style={{
                    marginBottom: '1rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--text-main)'
                }}>
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
};

const styles = {
    // Basic inline styles fallback or extension
};

export default Card;
