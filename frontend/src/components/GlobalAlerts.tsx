import { useEffect, useState } from 'react';
import { useAlerts } from '../context/AlertsContext';
import { useNavigate } from 'react-router-dom';

export function GlobalAlerts() {
    const { latestTrigger, clearTrigger } = useAlerts();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (latestTrigger) {
            setVisible(true);
            // Play a sound? (Optional, maybe later)
        }
    }, [latestTrigger]);

    if (!latestTrigger || !visible) return null;

    const handleClose = () => {
        setVisible(false);
        clearTrigger();
    };

    const handleView = () => {
        setVisible(false);
        clearTrigger();
        navigate('/alerts');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
            <div style={{
                backgroundColor: '#1e222d',
                border: '1px solid #2a2e39', // Gold/Yellow border for attention
                borderTop: '4px solid #26cc62', // Green top accent
                borderRadius: '12px',
                padding: '32px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                textAlign: 'center',
                animation: 'slideUp 0.3s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{
                    fontSize: '64px',
                    marginBottom: '-10px',
                    filter: 'drop-shadow(0 0 10px rgba(38, 204, 98, 0.4))'
                }}>
                    🔔
                </div>

                <h2 style={{
                    color: '#ffffff',
                    fontSize: '24px',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Price Alert Triggered
                </h2>

                <div style={{
                    fontSize: '18px',
                    color: '#d1d4dc',
                    lineHeight: '1.5',
                    background: '#131722',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #2a2e39'
                }}>
                    {latestTrigger.msg}
                </div>

                <div style={{ fontSize: '12px', color: '#8d929b' }}>
                    {new Date(latestTrigger.timestamp).toLocaleTimeString()}
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px' }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'transparent',
                            border: '1px solid #434651',
                            color: '#d1d4dc',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        DISMISS
                    </button>
                    <button
                        onClick={handleView}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#26cc62',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flex: 1,
                            boxShadow: '0 4px 12px rgba(38, 204, 98, 0.3)'
                        }}
                    >
                        VIEW ALERTS
                    </button>
                </div>
            </div>
        </div>
    );
}
