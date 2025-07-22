import React, { useState, useRef } from 'react';

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  isDisabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, isDisabled }) => {
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      const promises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(base64Images => {
        const updatedImages = [...images, ...base64Images];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      });
    }
    // Reset file input to allow uploading the same file again
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">
            3. رفع صور مخصصة (اختياري)
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {images.map((image, index) => (
                <div key={index} className="relative group">
                    <img src={image} alt={`Uploaded ${index}`} className="w-full h-24 object-cover rounded-md" />
                    <button
                        onClick={() => removeImage(index)}
                        disabled={isDisabled}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        aria-label="Remove image"
                    >
                        &times;
                    </button>
                </div>
            ))}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled}
                className="w-full h-24 border-2 border-dashed border-slate-600 rounded-md flex items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-white transition-colors disabled:cursor-not-allowed disabled:hover:border-slate-600"
            >
                + إضافة
            </button>
            <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={isDisabled}
            />
        </div>
    </div>
  );
};

export default ImageUploader;
