import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Minimize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load the heavy softphone component
const EnhancedSoftphone = React.lazy(() => import('@/components/EnhancedSoftphone').then(module => ({ default: module.EnhancedSoftphone })));
import { useAuth } from '@/contexts/AuthContext';
import { useCallSession } from '@/contexts/CallSessionContext';

interface EnhancedFloatingSoftphoneProps {
  className?: string;
  defaultPosition?: { x: number; y: number };
}

export const EnhancedFloatingSoftphone: React.FC<EnhancedFloatingSoftphoneProps> = ({
  className,
  defaultPosition = { x: 20, y: 20 }
}) => {
  // Always call hooks unconditionally at the top level
  const auth = useAuth();
  const callSession = useCallSession();

  const { isAuthenticated, isLoading: authLoading } = auth;
  const { intent, consumeIntent } = callSession;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Save/restore floating button position
  const getInitialButtonPosition = () => {
    const saved = localStorage.getItem('softphone_button_position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse button position');
      }
    }
    return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
  };

  const [position, setPosition] = useState(getInitialButtonPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  // Save button position when it changes
  useEffect(() => {
    localStorage.setItem('softphone_button_position', JSON.stringify(position));
  }, [position]);

  const handleDoubleClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      setIsOpen(true);
      setIsMinimized(false);
    }
    setLastClickTime(currentTime);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handlePositionChange = (newPosition: { x: number; y: number }) => {
    // This is for the softphone window position, not the button
    // Don't update button position when softphone moves
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Use the appropriate ref based on current state
    const currentRef = isMinimized ? divRef.current : buttonRef.current;
    if (!currentRef) return;

    setIsDragging(true);
    const rect = currentRef.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setPosition({
      x: Math.max(0, Math.min(newX, window.innerWidth - 56)),
      y: Math.max(0, Math.min(newY, window.innerHeight - 56))
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - 56)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - 56))
      }));
    };

    const handleIncomingCall = (event: Event) => {
      // Auto-open softphone when incoming call arrives
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('incoming_call', handleIncomingCall);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('incoming_call', handleIncomingCall);
    };
  }, []);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (intent) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [intent]);

  const handleCallStart = (number: string, campaignId?: string) => {
    console.log('Call started to:', number, 'Campaign:', campaignId);
  };

  const handleCallEnd = (duration: number, callData: { campaignId?: string; recipientId?: string; outcome?: string; notes?: string }) => {
    console.log('Call ended, duration:', duration, 'Data:', callData);
  };

  // Only show if user is authenticated and not loading
  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        ref={buttonRef}
        onClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        className={cn(
          "fixed h-14 w-14 rounded-full shadow-lg z-40 cursor-move",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-200 hover:scale-110 select-none",
          isDragging ? "opacity-80 scale-95" : "",
          className
        )}
        size="icon"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          bottom: 'auto',
          right: 'auto',
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        <Phone className="h-6 w-6" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div
        ref={divRef}
        className={cn(
          "fixed z-50 cursor-move select-none",
          isDragging ? "opacity-80" : ""
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          bottom: 'auto',
          right: 'auto',
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground mr-2"
          size="icon"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="h-8 w-8 rounded-full shadow-lg bg-red-600 hover:bg-red-700 text-white"
          size="icon"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="fixed z-50 bg-background rounded-lg shadow-2xl border p-4 flex items-center justify-center"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '320px',
          height: '500px'
        }}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading phone...</p>
        </div>
      </div>
    }>
      <EnhancedSoftphone
        isOpen={isOpen && !isMinimized}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        onPositionChange={handlePositionChange}
        pendingIntent={intent}
        onIntentConsumed={consumeIntent}
      />
    </Suspense>
  );
};

export default EnhancedFloatingSoftphone;
