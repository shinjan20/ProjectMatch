import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutOptions {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    enabled?: boolean;
}

export function useKeyboardShortcut(
    key: string,
    callback: KeyHandler,
    options: ShortcutOptions = {}
) {
    const { preventDefault = false, stopPropagation = false, enabled = true } = options;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Handle modifier keys if specified in the key string like 'Cmd+K' or 'Ctrl+K'
            // For now, handling simple exact match keys
            if (event.key === key) {
                // Don't trigger if the user is typing in an input or textarea
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
