import React from 'react';
import { Upload, Check, ImagePlus } from 'lucide-react';
import { PhotoSlot } from '../types';

interface PhotoUploaderProps {
  slot: PhotoSlot;
  onUpload: (id: string, file: File) => void;
  isActive: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ slot, onUpload, isActive }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(slot.id, e.target.files[0]);
    }
  };

  const isCenter = slot.isCenter;

  return (
    <div 
      className={`
        relative group rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer
        ${slot.image 
          ? 'border-blue-200 bg-blue-50/50' 
          : 'border-dashed border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30'
        }
        ${isActive ? 'ring-4 ring-blue-100 border-blue-400' : ''}
        ${isCenter ? 'col-span-1 sm:col-span-2 shadow-sm' : ''}
      `}
    >
      <input 
        type="file" 
        accept="image/*" 
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
        onChange={handleFileChange}
      />
      
      <div className={`p-3 flex items-center gap-4 ${isCenter ? 'p-4' : ''}`}>
        {/* Preview Bubble */}
        <div className={`
          rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm overflow-hidden
          ${isCenter ? 'w-16 h-16' : 'w-12 h-12'}
          ${slot.image ? 'bg-white' : 'bg-slate-50 text-slate-300 group-hover:text-blue-400'}
        `}>
          {slot.image ? (
            <img 
              src={URL.createObjectURL(slot.file!)} 
              alt="preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            isCenter ? <ImagePlus size={28} /> : <Upload size={20} />
          )}
        </div>
        
        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
             <p className={`font-bold text-slate-700 truncate ${isCenter ? 'text-lg text-blue-900' : 'text-sm'}`}>
              {slot.label}
            </p>
             {slot.image && (
              <div className="bg-green-100 text-green-600 rounded-full p-1">
                <Check size={isCenter ? 18 : 14} />
              </div>
            )}
          </div>
          
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {slot.image 
              ? 'Tap to change photo' 
              : isCenter ? 'Upload the star photo!' : 'Add photo'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploader;