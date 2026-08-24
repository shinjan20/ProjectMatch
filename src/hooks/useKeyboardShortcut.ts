import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutOptions {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    enabled?: boolean;
    ctrl?: boolean;
    meta?: boolean;
}

export function useKeyboardShortcut(
    key: string,
    callback: KeyHandler,
    options: ShortcutOptions = {}
) {
    const { preventDefault = false, stopPropagation = false, enabled = true, ctrl = false } = options;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            const keyMatch = event.key.toLowerCase() === key.toLowerCase();
            const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : true;
            
            if (keyMatch && ctrlMatch) {
                // Don't trigger if the user is typing in an input or textarea unless ctrl/meta is pressed

                const target = event.target as HTMLElement;
                if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable
                ) {
                    return;
                }

                if (preventDefault) event.preventDefault();
                if (stopPropagation) event.stopPropagation();

                callback(event);
            }
        },
        [key, callback, preventDefault, stopPropagation, enabled]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
