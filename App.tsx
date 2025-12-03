import React, { useState, useEffect, useRef } from 'react';
import { Download, Sparkles, Wand2, RefreshCw, Heart, MousePointerClick, Settings2, Image as ImageIcon } from 'lucide-react';
import CollageCanvas, { CollageHandle } from './components/CollageCanvas';
import PhotoUploader from './components/PhotoUploader';
import { PhotoSlot } from './types';
import { generateBirthdayMessage } from './services/geminiService';

const INITIAL_SLOTS: PhotoSlot[] = [];

// Configuration for positions
const CENTER_X = 0.5;
const CENTER_Y = 0.5;
const OUTER_RADIUS = 0.36; 
const SLOT_RADIUS = 0.08; 
const CENTER_RADIUS = 0.16;

// Generate initial slots: Day 1 + 11 Months (Outer) + Birthday (Center)
const LABELS = [
  "Day 1", "Month 1", "Month 2", "Month 3", 
  "Month 4", "Month 5", "Month 6", "Month 7", 
  "Month 8", "Month 9", "Month 10", "Month 11"
];

// Calculate positions for clock face (starting at 12 o'clock)
LABELS.forEach((label, index) => {
  const angleDeg = index * 30 - 90; // -90 to start at top
  const angleRad = (angleDeg * Math.PI) / 180;
  
  INITIAL_SLOTS.push({
    id: `slot-${index}`,
    label: label,
    image: null,
    file: null,
    x: CENTER_X + OUTER_RADIUS * Math.cos(angleRad),
    y: CENTER_Y + OUTER_RADIUS * Math.sin(angleRad),
    radius: SLOT_RADIUS,
    imageOffsetX: 0,
    imageOffsetY: 0
  });
});

// Add Center Slot
INITIAL_SLOTS.push({
  id: 'birthday',
  label: "1st Birthday",
  image: null,
  file: null,
  x: CENTER_X,
  y: CENTER_Y,
  radius: CENTER_RADIUS,
  isCenter: true,
  imageOffsetX: 0,
  imageOffsetY: 0
});

// Defines export presets
const FORMATS = [
  { id: 'sq', label: 'Square (Instagram)', w: 3000, h: 3000, icon: 'square' },
  { id: 'port', label: 'Portrait (Feed)', w: 2400, h: 3000, icon: 'rect-v' },
  { id: 'land', label: 'Landscape (FB)', w: 3200, h: 1800, icon: 'rect-h' },
  { id: 'story', label: 'Story (Full Screen)', w: 2160, h: 3840, icon: 'mobile' },
];

export default function App() {
  const [slots, setSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS);
  const [message, setMessage] = useState<string>("Happy 1st Birthday to our little prince!");
  const [messagePos, setMessagePos] = useState({ x: 0.5, y: 0.92 });
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(FORMATS[0]);
  
  const canvasRef = useRef<CollageHandle>(null);
  const [previewWidth, setPreviewWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        // Limit max width but ensure it fits container
        const width = containerRef.current.offsetWidth;
        setPreviewWidth(Math.min(width, 700)); 
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSlots(prev => prev.map(slot => {
          if (slot.id === id) {
            return { ...slot, image: img, file: file, imageOffsetX: 0, imageOffsetY: 0 };
          }
          return slot;
        }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSlotOffset = (id: string, dx: number, dy: number) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id === id) {
        return { 
          ...slot, 
          imageOffsetX: slot.imageOffsetX + dx,
          imageOffsetY: slot.imageOffsetY + dy 
        };
      }
      return slot;
    }));
  };

  const handleGenerateMessage = async () => {
    setIsGeneratingMsg(true);
    const newMsg = await generateBirthdayMessage();
    setMessage(newMsg);
    setIsGeneratingMsg(false);
  };

  const completedCount = slots.filter(s => s.image !== null).length;
  const progress = Math.round((completedCount / slots.length) * 100);

  return (
    <div className="min-h-screen pb-12 font-fredoka">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-cyan-300 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Heart fill="currentColor" size={20} className="text-white" />
            </div>
            <div>
               <h1 className="text-2xl font-bold text-slate-800 tracking-tight">First Year</h1>
               <p className="text-xs text-slate-500 font-medium -mt-1">Milestone Creator</p>
            </div>
          </div>
          
          <button 
            onClick={() => canvasRef.current?.download()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Save HD Image</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Canvas Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Format Selector Toolbar */}
            <div className="w-full flex justify-center mb-6">
              <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-1">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      selectedFormat.id === fmt.id 
                        ? 'bg-blue-100 text-blue-700 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {fmt.icon === 'square' && <div className="w-3 h-3 border-2 border-current rounded-sm"/>}
                    {fmt.icon === 'rect-v' && <div className="w-2.5 h-3.5 border-2 border-current rounded-sm"/>}
                    {fmt.icon === 'rect-h' && <div className="w-4 h-2.5 border-2 border-current rounded-sm"/>}
                    {fmt.icon === 'mobile' && <div className="w-2 h-4 border-2 border-current rounded-sm"/>}
                    <span className="hidden sm:inline">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div 
              ref={containerRef}
              className="w-full flex justify-center sticky top-28"
            >
              <CollageCanvas 
                ref={canvasRef} 
                slots={slots} 
                width={selectedFormat.w}
                height={selectedFormat.h}
                displaySize={previewWidth} 
                message={message}
                messagePos={messagePos}
                onMessagePosChange={setMessagePos}
                onSlotOffsetChange={handleUpdateSlotOffset}
              />
            </div>
            
            <p className="mt-6 text-slate-400 text-sm font-medium flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-slate-100">
              <MousePointerClick size={14} />
              Drag photos to adjust • Drag text to move
            </p>
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Message Generator */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-3xl shadow-sm border border-blue-50 ring-1 ring-blue-100/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Wand2 size={20} className="text-purple-400"/>
                  Birthday Wish
                </h2>
                <button 
                  onClick={handleGenerateMessage}
                  disabled={isGeneratingMsg}
                  className="text-xs font-bold text-purple-600 bg-purple-50 px-4 py-1.5 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isGeneratingMsg ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isGeneratingMsg ? 'Thinking...' : 'AI Writer'}
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 border-2 border-slate-100 rounded-2xl text-slate-600 focus:ring-4 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none bg-slate-50/50 font-medium text-center leading-relaxed transition-all"
                rows={2}
                placeholder="Enter a message for the card..."
              />
            </div>

            {/* Photo Slots */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-3xl shadow-sm border border-blue-50 ring-1 ring-blue-100/50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-slate-800 text-lg">Milestones</h2>
                <div className="flex items-center gap-2">
                   <Settings2 size={16} className="text-slate-300" />
                   <span className="text-sm font-bold text-slate-400">
                    {selectedFormat.w} x {selectedFormat.h}px
                   </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-300 h-full transition-all duration-700 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Center Slot First */}
                <div className="sm:col-span-2 pb-2">
                  <PhotoUploader 
                    slot={slots[12]} // Birthday slot
                    onUpload={handleUpload}
                    isActive={true}
                  />
                </div>
                
                {/* Other slots */}
                {slots.slice(0, 12).map((slot) => (
                  <PhotoUploader 
                    key={slot.id} 
                    slot={slot} 
                    onUpload={handleUpload}
                    isActive={false}
                  />
                ))}
              </div>
            </div>

            {/* Quick Tips */}
             <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-500">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">Pro Tip</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      For the best result, use close-up photos of your baby's face for the small circles. 
                      You can drag photos inside the circles to center them perfectly!
                    </p>
                  </div>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}