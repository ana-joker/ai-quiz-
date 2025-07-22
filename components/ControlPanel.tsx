import React, { useRef, useState } from 'react';
import { LoaderIcon } from './Icons';

interface ControlPanelProps {
    onPdfUpload: (file: File) => void;
    isProcessing: boolean;
    isDisabled: boolean; // To disable when main generation is running
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onPdfUpload, isProcessing, isDisabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };
    
    const handleUploadClick = () => {
        if (selectedFile) {
            onPdfUpload(selectedFile);
            setSelectedFile(null); // Reset after upload
            if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
        }
    };

    const isButtonDisabled = isProcessing || isDisabled || !selectedFile;

    return (
        <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">1. رفع PDF إلى المخزن</h3>
             <div className="flex flex-col sm:flex-row gap-4">
                <div 
                    className="relative flex-grow w-full bg-slate-700 border-2 border-dashed border-slate-600 text-slate-400 rounded-md p-4 text-center cursor-pointer hover:border-cyan-500 hover:text-white transition-colors"
                    onClick={() => !isDisabled && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        id="pdf-file"
                        name="pdfFile"
                        ref={fileInputRef}
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={isProcessing || isDisabled}
                    />
                    {selectedFile ? (
                         <span className="text-green-400">{selectedFile.name}</span>
                    ) : (
                        <span>انقر هنا لاختيار ملف PDF</span>
                    )}
                </div>
                 <button 
                    onClick={handleUploadClick}
                    disabled={isButtonDisabled} 
                    className="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'جاري المعالجة...' : 'معالجة و إضافة'}
                    {isProcessing && <div id="loader" style={{display: 'inline-block', marginLeft: '8px'}}></div>}
                </button>
            </div>
        </div>
    );
};

export default ControlPanel;
