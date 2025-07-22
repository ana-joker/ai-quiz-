import React, { useState, useEffect } from 'react';
import * as dbService from '../services/dbService';
import { StoredPdfMeta, StoredPdfData } from '../types';
import Modal from './Modal';

interface DataStoreViewerProps {
  onSelectPdf: (id: number | null) => void;
  selectedPdfId: number | null;
  refreshKey: number; // A key to trigger re-fetch
}

const DataStoreViewer: React.FC<DataStoreViewerProps> = ({ onSelectPdf, selectedPdfId, refreshKey }) => {
    const [pdfs, setPdfs] = useState<StoredPdfMeta[]>([]);
    const [viewingPdf, setViewingPdf] = useState<StoredPdfData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPdfs = async () => {
        const pdfsMeta = await dbService.getAllPdfsMeta();
        setPdfs(pdfsMeta);
    };

    useEffect(() => {
        fetchPdfs();
    }, [refreshKey]); // Refetch when refreshKey changes

    const handleView = async (id: number) => {
        const pdfData = await dbService.getPdfData(id);
        if (pdfData) {
            setViewingPdf(pdfData);
            setIsModalOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("هل أنت متأكد من حذف هذا الملف من المخزن؟")) {
            await dbService.deletePdf(id);
            if (selectedPdfId === id) {
                onSelectPdf(null); // Deselect if the deleted one was selected
            }
            fetchPdfs(); // Re-fetch the list
        }
    };
    
    const handleSelect = (id: number) => {
        onSelectPdf(id);
    }
    
    return (
        <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">2. اختيار من المخزن</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {pdfs.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">المخزن فارغ. قم برفع ملف PDF لتبدأ.</p>
                ) : (
                    pdfs.map(pdf => (
                        <div 
                            key={pdf.id}
                            className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-md transition-all ${selectedPdfId === pdf.id ? 'bg-cyan-900/50 ring-2 ring-cyan-400' : 'bg-slate-900/50'}`}
                        >
                            <div className="flex-grow mb-2 sm:mb-0 text-center sm:text-right">
                                <p className="font-bold text-white">{pdf.filename}</p>
                                <p className="text-xs text-slate-400">
                                    {new Date(pdf.createdAt).toLocaleString('ar-EG')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handleSelect(pdf.id)} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-1 px-3 rounded disabled:opacity-50" disabled={selectedPdfId === pdf.id}>
                                    {selectedPdfId === pdf.id ? 'محدد' : 'استخدام'}
                                </button>
                                <button onClick={() => handleView(pdf.id)} className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold py-1 px-3 rounded">
                                    عرض
                                </button>
                                <button onClick={() => handleDelete(pdf.id)} className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold py-1 px-3 rounded">
                                    حذف
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {viewingPdf && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`عرض: ${viewingPdf.filename}`}>
                   <div className="space-y-4">
                        <div>
                            <h4 className="text-lg font-bold text-cyan-400 mb-2">النص المستخرج:</h4>
                            <textarea
                                readOnly
                                value={viewingPdf.text}
                                className="w-full h-96 bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200"
                            />
                        </div>
                   </div>
                </Modal>
            )}
        </div>
    );
};

export default DataStoreViewer;
