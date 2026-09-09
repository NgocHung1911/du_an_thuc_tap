import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Wifi, WifiOff } from 'lucide-react';

export const WebSocketStatusBadge: React.FC = () => {
  const { isConnected, connectionError } = useWebSocket();

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
        isConnected
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
      }`}
      title={isConnected ? 'Realtime WebSocket Connected' : connectionError || 'Reconnecting WebSocket...'}
    >
      {isConnected ? (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi size={13} className="text-emerald-400" />
          <span className="hidden md:inline">Realtime</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <WifiOff size={13} className="text-amber-400" />
          <span className="hidden md:inline">Reconnecting...</span>
        </div>
      )}
    </div>
  );
};
