import React, { useRef, useEffect } from 'react';
import SignaturePadBase from 'signature_pad';
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SignaturePad({ value, onChange, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadBase | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    padRef.current = new SignaturePadBase(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
    });

    if (value) {
      padRef.current.fromDataURL(value);
    }

    return () => {
      if (padRef.current) {
        padRef.current.off();
      }
    };
  }, [value]);

  const handleEnd = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onChange?.(padRef.current.toDataURL());
    }
  };

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
      onChange?.('');
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="border rounded-md p-2 bg-white">
        <canvas
          ref={canvasRef}
          onMouseUp={handleEnd}
          onTouchEnd={handleEnd}
          className="w-full h-[200px] touch-none"
        />
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Clear Signature
      </button>
    </div>
  );
} 