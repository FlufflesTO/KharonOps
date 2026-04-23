import React, { useEffect, useState } from 'react';

interface PresenceIndicatorProps {
  userId: string;
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ userId, className = "" }) => {
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('offline');

  useEffect(() => {
    // Simulate presence logic
    const statuses: Array<'online' | 'away' | 'offline'> = ['online', 'away', 'offline'];
    const nextS = statuses[Math.floor(Math.random() * statuses.length)]; if (nextS) setStatus(nextS);
    
    const interval = setInterval(() => {
       const nextS2 = statuses[Math.floor(Math.random() * statuses.length)]; if (nextS2) setStatus(nextS2);
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const colorMap = {
    online: '#10b981',
    away: '#f59e0b',
    offline: '#6b7280'
  };

  return (
    <div className={`presence-indicator ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: colorMap[status],
        boxShadow: status === 'online' ? `0 0 8px ${colorMap.online}` : 'none'
      }} />
      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>{status}</span>
    </div>
  );
};
