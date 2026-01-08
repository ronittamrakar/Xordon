import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  onSave?: () => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  multiline = false,
  placeholder = 'Click to edit...',
  className = '',
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
      } else {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
    onSave?.();
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 min-h-[80px] ${className}`}
            autoFocus
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 ${className}`}
            autoFocus
          />
        )}
        <Button size="sm" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-muted/50 rounded p-2 min-h-[2rem] transition-colors ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </div>
  );
};
