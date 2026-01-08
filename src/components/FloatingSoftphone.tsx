import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Minimize2, X, Maximize2 } from 'lucide-react';
import { Softphone } from '@/components/Softphone';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface FloatingSoftphoneProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

export const FloatingSoftphone: React.FC<FloatingSoftphoneProps> = ({ className }) => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right corner
  useEffect(() => {
    const updatePosition = () => {
      const padding = 24; // 6 * 4px (tailwind spacing)
      setPosition({
        x: window.innerWidth - 72 - padding, // 72px button width + padding
        y: window.innerHeight - 72 - padding
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen && !isMinimized) return; // Don't drag when modal is open

    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const buttonWidth = 72;
    const buttonHeight = 72;
    const padding = 24;

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Constrain to viewport
    newX = Math.max(padding, Math.min(newX, window.innerWidth - buttonWidth - padding));
    newY = Math.max(padding, Math.min(newY, window.innerHeight - buttonHeight - padding));

    setPosition({ x: newX, y: newY });
  };

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

  // Only show if user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        ref={buttonRef}
        onClick={handleOpen}
        onMouseDown={handleMouseDown}
        className={cn(
          "fixed h-16 w-16 rounded-full shadow-lg z-40 transition-all duration-200",
          "bg-primary hover:bg-primary/90",
          "text-primary-foreground border border-border",
          "hover:scale-110 active:scale-95",
          isDragging && "cursor-grabbing scale-110",
          !isDragging && "cursor-grab",
          className
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
        size="icon"
        title="Open Softphone (Drag to move)"
      >
        <Phone className="h-7 w-7" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 transition-all duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsMinimized(false)}
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border border-border hover:scale-110 transition-all"
            size="icon"
            title="Restore Softphone"
          >
            <Maximize2 className="h-6 w-6" />
          </Button>
          <Button
            onClick={handleClose}
            className="h-10 w-10 rounded-full shadow-lg bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-2 border-red-500/20 hover:scale-110 transition-all"
            size="icon"
            title="Close Softphone"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Softphone
      isOpen={isOpen && !isMinimized}
      onClose={handleClose}
      onMinimize={handleMinimize}
      onCallStart={(number) => {
        console.log('Call started to:', number);
      }}
      onCallEnd={(duration) => {
        console.log('Call ended, duration:', duration);
      }}
    />
  );
};

export default FloatingSoftphone;
