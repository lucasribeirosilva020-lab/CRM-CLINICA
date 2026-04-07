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
                    'absolute z-50 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-200 py-1.5 animate-in fade-in zoom-in duration-200',
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
                                'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg mx-1 my-0.5 w-[calc(100%-8px)]',
                                item.variant === 'danger'
                                    ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
