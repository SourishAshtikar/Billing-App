import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    style,
    isLoading = false,
    disabled,
    ...props
}) => {

    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return 'var(--primary-color)';
            case 'secondary': return 'white';
            case 'danger': return 'var(--danger-color)';
            case 'ghost': return 'transparent';
            default: return 'var(--primary-color)';
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary': return 'white';
            case 'secondary': return 'var(--text-main)';
            case 'danger': return 'white';
            case 'ghost': return 'var(--text-secondary)';
            default: return 'white';
        }
    };

    const getBorder = () => {
        if (variant === 'secondary') return '1px solid var(--border-color)';
        return 'none';
    };

    const padding = size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '1rem 2rem' : '0.75rem 1.5rem';

    return (
        <button
            style={{
                backgroundColor: getBackgroundColor(),
                color: getTextColor(),
                border: getBorder(),
                padding: padding,
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (disabled || isLoading) ? 0.7 : 1,
                cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
                ...style
            }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span style={{ width: '1em', height: '1em', border: '2px solid currentColor', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                    Loading...
                </>
            ) : children}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </button>
    );
};

export default Button;
