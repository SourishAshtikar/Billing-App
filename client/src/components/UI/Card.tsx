import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, title, className = '', style, ...props }) => {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            ...style
        }} className={className} {...props}>
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
