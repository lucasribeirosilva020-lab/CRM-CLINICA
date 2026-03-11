'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DropdownItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
}

export default function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div className={cn(
                    'absolute z-50 mt-2 w-48 rounded-xl bg-white shadow-lg border border-border py-1 animate-in fade-in zoom-in duration-200',
                    align === 'right' ? 'right-0' : 'left-0'
                )}>
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50',
                                item.variant === 'danger' ? 'text-error hover:bg-error/5' : 'text-text'
                            )}
                        >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
