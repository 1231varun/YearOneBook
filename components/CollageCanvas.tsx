import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { PhotoSlot } from '../types';

interface CollageCanvasProps {
  slots: PhotoSlot[];
  width?: number; // Pixel width (export)
  height?: number; // Pixel height (export)
  displaySize?: number; // CSS Pixel width for preview
  message?: string;
  messagePos: { x: number, y: number };
  onMessagePosChange: (pos: { x: number, y: number }) => void;
  onSlotOffsetChange: (id: string, dx: number, dy: number) => void;
}

export interface CollageHandle {
  download: () => void;
}

const CollageCanvas = forwardRef<CollageHandle, CollageCanvasProps>(({ 
  slots, 
  width = 3000,
  height = 3000,
  displaySize = 600,
  message,
  messagePos,
  onMessagePosChange,
  onSlotOffsetChange
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: 'message' } | { type: 'slot', id: string } | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState('default');

  // The base unit for scaling elements (font size, strokes) is the smaller dimension (the content square)
  const scaleBase = Math.min(width, height);
  
  // Calculate the "Content Square" where the circle lives
  // This ensures the collage stays circular and centered even on 16:9 or 9:16 canvases
  const contentSize = scaleBase;
  const paddingX = (width - contentSize) / 2;
  const paddingY = (height - contentSize) / 2;

  // Helper to draw a star
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear and set background
    ctx.clearRect(0, 0, width, height);
    
    // Main white card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle background pattern (Polka dots)
    // Cover the ENTIRE canvas
    ctx.fillStyle = '#f0f9ff';
    const dotSpacing = scaleBase * 0.05;
    for (let i = 0; i < width; i += dotSpacing) {
      for (let j = 0; j < height; j += dotSpacing) {
        if ((Math.round(i) + Math.round(j)) % (Math.round(dotSpacing * 2)) === 0) {
          ctx.beginPath();
          ctx.arc(i, j, scaleBase * 0.003, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Decorative Background Elements (Stars and Sparkles)
    // Position relative to full canvas to fill space
    const decorations = [
      { x: 0.1, y: 0.1, color: '#fed7aa', size: 0.02 }, // Orange
      { x: 0.9, y: 0.1, color: '#bae6fd', size: 0.025 }, // Blue
      { x: 0.1, y: 0.9, color: '#bbf7d0', size: 0.02 }, // Green
      { x: 0.9, y: 0.9, color: '#fbcfe8', size: 0.025 }, // Pink
      { x: 0.5, y: 0.15, color: '#ddd6fe', size: 0.015 }, // Purple
      // Extra stars for wide/tall formats
      { x: 0.2, y: 0.5, color: '#fef08a', size: 0.015 }, 
      { x: 0.8, y: 0.5, color: '#bfdbfe', size: 0.015 }, 
    ];

    decorations.forEach(d => {
      drawStar(ctx, d.x * width, d.y * height, 5, d.size * scaleBase, (d.size/2) * scaleBase, d.color);
    });

    // 3. Draw Message (Bottom Banner Style)
    if (message) {
      const fontSize = scaleBase * 0.035;
      ctx.font = `600 ${fontSize}px 'Fredoka', sans-serif`;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textX = messagePos.x * width;
      const textY = messagePos.y * height;
      
      // Text Shadow (soft)
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#475569'; // Slate 600
      
      // Simple word wrap
      const maxWidth = width * 0.8;
      const words = message.split(' ');
      let line = '';
      let y = textY;
      const lineHeight = fontSize * 1.3;

      // Check if we need to wrap
      const testWidth = ctx.measureText(message).width;
      
      if (testWidth > maxWidth) {
         // Multi-line logic
         let lines = [];
         for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
         }
         lines.push(line);
         
         // Move up slightly to center the block
         y -= ((lines.length - 1) * lineHeight) / 2;

         lines.forEach(l => {
           ctx.fillText(l, textX, y);
           y += lineHeight;
         });
      } else {
        ctx.fillText(message, textX, y);
      }
      
      // Reset Shadow
      ctx.shadowColor = 'transparent';
    }

    // 4. Draw slots
    slots.forEach(slot => {
      // Map slot unit coordinates (0-1) to the Content Square pixels
      // slot.x=0 is left of square, slot.x=1 is right of square
      const cx = paddingX + slot.x * contentSize;
      const cy = paddingY + slot.y * contentSize;
      const r = slot.radius * contentSize;

      // --- The Photo Frame ---
      
      ctx.save();
      
      // Drop Shadow for the whole element
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = scaleBase * 0.02;
      ctx.shadowOffsetX = scaleBase * 0.005;
      ctx.shadowOffsetY = scaleBase * 0.005;

      // White Border Circle (The "Sticker" base)
      ctx.beginPath();
      ctx.arc(cx, cy, r + (scaleBase * 0.015), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // Reset shadow for image clipping
      ctx.shadowColor = 'transparent';

      // Inner Circle (The Image Container)
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      if (slot.image) {
        // Draw Image with "Aspect Fill"
        const img = slot.image;
        const imgAspect = img.width / img.height;
        const drawAspect = 1; 

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > drawAspect) {
          drawHeight = r * 2;
          drawWidth = drawHeight * imgAspect;
          offsetX = cx - drawWidth / 2;
          offsetY = cy - r;
        } else {
          drawWidth = r * 2;
          drawHeight = drawWidth / imgAspect;
          offsetX = cx - r;
          offsetY = cy - drawHeight / 2;
        }

        // Apply User Offset (Panning)
        // Offset is stored relative to scaleBase to maintain feel across resolutions
        offsetX += slot.imageOffsetX * scaleBase;
        offsetY += slot.imageOffsetY * scaleBase;

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // Placeholder
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 ${r * 0.3}px 'Fredoka', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("+", cx, cy);
      }

      ctx.restore();

      // --- The Label Badge ---
      if (!slot.isCenter) {
        let badgeText = "";
        let badgeColor = "#bae6fd"; // Default Blue
        
        if (slot.label.includes("Day")) {
          badgeText = "Day 1";
          badgeColor = "#fbcfe8"; // Pink
        } else {
          badgeText = slot.label.replace("Month ", "");
          const num = parseInt(badgeText);
          const colors = ["#bae6fd", "#bbf7d0", "#fde68a", "#ddd6fe"]; // Blue, Green, Yellow, Purple
          badgeColor = colors[num % colors.length];
        }

        const badgeAngle = Math.PI / 4; 
        const badgeDist = r; 
        const badgeX = cx + Math.cos(badgeAngle) * badgeDist;
        const badgeY = cy + Math.sin(badgeAngle) * badgeDist;
        const badgeRadius = r * 0.35;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = badgeColor;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = scaleBase * 0.005;
        ctx.stroke();

        ctx.fillStyle = '#475569';
        const fontSize = badgeText.length > 2 ? badgeRadius * 0.7 : badgeRadius * 1.2;
        ctx.font = `700 ${fontSize}px 'Fredoka', sans-serif`;
        ctx.shadowColor = 'transparent';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX, badgeY + (badgeRadius * 0.1));
        
        ctx.restore();
      } else {
        // Center Rim
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + (scaleBase * 0.015), 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24'; // Amber 400
        ctx.lineWidth = scaleBase * 0.005;
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  useEffect(() => {
    draw();
    document.fonts.ready.then(draw);
  }, [slots, message, messagePos, width, height]);

  // --- Interaction Handlers ---

  const getRelativePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Return 0-1 relative to the *displayed* canvas size
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    const pos = getRelativePos(e);
    setLastMousePos(pos);
    
    // 1. Check if hitting text (Use width/height relative)
    const textDistX = (pos.x - messagePos.x) * width;
    const textDistY = (pos.y - messagePos.y) * height;
    // Approximate hit area: 30% of width wide, 10% of height tall?
    // Simple radial check scaled:
    const textDist = Math.sqrt(Math.pow(textDistX, 2) + Math.pow(textDistY, 2));
    if (textDist < scaleBase * 0.15) { 
      setIsDragging(true);
      setDragTarget({ type: 'message' });
      return;
    }

    // 2. Check slots (Need to map pointer to content square coords)
    // Pointer (0-1 of Rect) -> Pixels -> Subtract Padding -> Divide by Content Size
    const pointerPixelX = pos.x * width;
    const pointerPixelY = pos.y * height;

    for (const slot of slots) {
      const slotCx = paddingX + slot.x * contentSize;
      const slotCy = paddingY + slot.y * contentSize;
      const r = slot.radius * contentSize;

      const dist = Math.sqrt(Math.pow(pointerPixelX - slotCx, 2) + Math.pow(pointerPixelY - slotCy, 2));
      
      if (dist < r && slot.image) {
        setIsDragging(true);
        setDragTarget({ type: 'slot', id: slot.id });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getRelativePos(e);
    
    // Update cursor logic (simplified for perf)
    setCursorStyle(isDragging ? 'grabbing' : 'grab');

    if (!isDragging || !dragTarget) return;

    e.preventDefault();
    
    // Calculate Delta in relative terms (0-1 of Canvas)
    const dRelX = pos.x - lastMousePos.x;
    const dRelY = pos.y - lastMousePos.y;

    if (dragTarget.type === 'message') {
      // Message uses 0-1 of Canvas
      onMessagePosChange({ x: messagePos.x + dRelX, y: messagePos.y + dRelY });
    } else if (dragTarget.type === 'slot') {
      // Slot Image Pan uses 0-1 of *Content Square* (technically scaleBase logic)
      // dRelX * width = pixel movement.
      // pixel movement / scaleBase = slot unit movement.
      const dxSlot = (dRelX * width) / scaleBase;
      const dySlot = (dRelY * height) / scaleBase;
      onSlotOffsetChange(dragTarget.id, dxSlot, dySlot);
    }

    setLastMousePos(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    setCursorStyle('default');
  };

  useImperativeHandle(ref, () => ({
    download: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `first-year-collage-${width}x${height}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  }));
  
  // Calculate display dimensions keeping aspect ratio
  const displayRatio = width / height;
  const displayH = displaySize / displayRatio;

  return (
    <div className="relative shadow-xl rounded-2xl overflow-hidden bg-white ring-8 ring-white transition-all duration-500" style={{ width: displaySize, height: displayH }}>
       <canvas 
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', cursor: cursorStyle, touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
       />
    </div>
  );
});

export default CollageCanvas;