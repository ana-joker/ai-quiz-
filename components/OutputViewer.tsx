import React, { useState, useEffect } from 'react';

interface OutputViewerProps {
  htmlContent: string;
}

const OutputViewer: React.FC<OutputViewerProps> = ({ htmlContent }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copyButtonText, setCopyButtonText] = useState('نسخ الكود');

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopyButtonText('تم النسخ!');
      setTimeout(() => setCopyButtonText('نسخ الكود'), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('فشل النسخ');
       setTimeout(() => setCopyButtonText('نسخ الكود'), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `WATFA-PEDIA_Quiz.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };
  
  // Use a key to force iframe re-render when htmlContent changes
  const [iframeKey, setIframeKey] = useState(0);
  useEffect(() => {
      setIframeKey(prev => prev + 1);
  }, [htmlContent]);


  return (
    <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-white">النتيجة النهائية</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'preview' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            معاينة حية
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'code' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            عرض الكود
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        {activeTab === 'preview' && (
          <div id="preview-panel">
            <iframe
              key={iframeKey}
              id="preview-iframe"
              srcDoc={htmlContent}
              className="w-full h-[75vh] bg-white rounded-md border border-slate-600"
              title="Quiz Preview"
              sandbox="allow-scripts"
            ></iframe>
          </div>
        )}
        {activeTab === 'code' && (
          <div id="code-panel">
            <div className="flex items-center justify-end gap-2 mb-2">
              <button onClick={handleCopy} className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold py-1 px-3 rounded">
                {copyButtonText}
              </button>
              <button onClick={handleDownload} className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-1 px-3 rounded">
                تنزيل الكود
              </button>
            </div>
            <pre className="bg-black/50 p-4 rounded-md overflow-auto h-[75vh]">
              <code className="language-html text-sm text-white whitespace-pre-wrap">
                {htmlContent}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputViewer;
