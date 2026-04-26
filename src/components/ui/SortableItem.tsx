
import React from 'react';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    id: string;
    children: React.ReactNode | ((args: { listeners: DraggableSyntheticListeners }) => React.ReactNode);
    className?: string;
    onClick?: () => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, className, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform), // Mobile.md #1: Force GPU acceleration
        transition,
        opacity: isDragging ? 0.3 : 1, // Visual feedback placeholder
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={className}
            onClick={onClick}
            {...attributes}
        >
            {typeof children === 'function' ? children({ listeners }) : children}
        </div>
    );
};
