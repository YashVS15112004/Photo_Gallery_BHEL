import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  title: string;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#333',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          fontSize: '12px',
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          {title}
        </div>
      )}
    </span>
  );
}; 