import React from 'react';
import { componentClasses } from '../../lib/theme';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    withBorder?: boolean;
    withShadow?: 'none' | 'sm' | 'md' | 'lg';
}

const getPaddingClasses = (padding: CardProps['padding']) => {
    switch (padding) {
        case 'none':
            return '';
        case 'sm':
            return 'p-3';
        case 'lg':
            return 'p-6';
        case 'md':
        default:
            return 'p-4';
    }
};

const getShadowClasses = (shadow: CardProps['withShadow']) => {
    switch (shadow) {
        case 'none':
            return '';
        case 'sm':
            return 'shadow-sm';
        case 'lg':
            return 'shadow-lg';
        case 'md':
        default:
            return 'shadow-md';
    }
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    withBorder = false,
    withShadow = 'md',
}) => {
    const baseClasses = componentClasses.card;
    const paddingClasses = getPaddingClasses(padding);
    const shadowClasses = getShadowClasses(withShadow);
    const borderClasses = withBorder ? 'border border-gray-200' : '';

    return (
        <div className={`${baseClasses} ${paddingClasses} ${shadowClasses} ${borderClasses} ${className}`}>
            {children}
        </div>
    );
};

export default Card; 