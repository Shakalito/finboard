import { useEffect, useState, type CSSProperties } from 'react';

type NotificationType = 'success' | 'error';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
    duration?: number;
}

export function Notification({ message, type, onClose, duration = 3500 }: NotificationProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Fade in on mount
        const timerIn = setTimeout(() => setVisible(true), 10);

        // Timer to start fade out
        const timerOut = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => {
            clearTimeout(timerIn);
            clearTimeout(timerOut);
        };
    }, [duration]);

    // When opacity transition ends, if visible is false, trigger onClose to unmount
    const handleTransitionEnd = () => {
        if (!visible) {
            onClose();
        }
    };

    const handleManualClose = () => {
        setVisible(false);
        // onClose will be triggered by transitionEnd
    };

    const isError = type === 'error';

    const style: CSSProperties = {
        padding: '12px',
        background: isError ? 'rgba(255, 77, 77, 0.1)' : 'rgba(38, 204, 98, 0.1)',
        color: isError ? '#ff4d4d' : '#26cc62',
        border: `1px solid ${isError ? '#ff4d4d' : '#26cc62'}`,
        borderRadius: '4px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
    };

    const closeBtnStyle: CSSProperties = {
        background: 'transparent',
        border: 'none',
        color: isError ? '#ff4d4d' : '#26cc62',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        padding: '0 4px',
        marginLeft: '12px'
    };

    return (
        <div style={style} onTransitionEnd={handleTransitionEnd}>
            <span style={{ flex: 1 }}>{message}</span>
            <button onClick={handleManualClose} style={closeBtnStyle}>✕</button>
        </div>
    );
}
