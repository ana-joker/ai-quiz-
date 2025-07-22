import React, { useState, useCallback } from 'react';
import { AppStatus, ProtocolStep, LogEntry, GeneratedQuizData, ProtocolStatus, QuizQuestion } from './types';
import { INITIAL_PROTOCOL_STEPS } from './constants';
import * as pdfService from './services/pdfService';
import * as geminiService from './services/geminiService';
import * as dbService from './services/dbService';
import * as htmlGenerator from './services/htmlGenerator';
import ControlPanel from './components/ControlPanel';
import ProtocolTracker from './components/ProtocolTracker';
import LogOutput from './components/LogOutput';
import DataStoreViewer from './components/DataStoreViewer';
import ImageUploader from './components/ImageUploader';
import OutputViewer from './components/OutputViewer';
import ChatWithDoc from './components/ChatWithDoc';
import { TelegramIcon, ArrowRightIcon } from './components/Icons';

const App: React.FC = () => {
    const [mainStatus, setMainStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [generationMode, setGenerationMode] = useState<'text' | 'pdf' | null>(null);
    const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>(INITIAL_PROTOCOL_STEPS);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

    // PDF Mode State
    const [pdfProcessing, setPdfProcessing] = useState(false);
    const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);
    const [dataStoreRefreshKey, setDataStoreRefreshKey] = useState(0);

    // Text Mode State
    const [sourceText, setSourceText] = useState('');

    // Shared State for active document
    const [activeDocumentText, setActiveDocumentText] = useState<string | null>(null);

    // Shared State for generation
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [generationConfig, setGenerationConfig] = useState({
        mcqCount: 5,
        caseCount: 1,
        questionsPerCase: 2,
        difficulty: 'mix',
        customInstructions: ''
    });

    const addLog = useCallback((message: string, type: 'log' | 'error' | 'success' = 'log') => {
        setLogs(prev => [...prev, { id: prev.length, message, type }]);
    }, []);

    const updateProtocolStatus = useCallback((id: string, status: ProtocolStatus, newText?: string) => {
        setProtocolSteps(prev => prev.map(step => step.id === id ? { ...step, status, text: newText || step.text } : step));
    }, []);

    const resetGenerationState = () => {
        setProtocolSteps(INITIAL_PROTOCOL_STEPS);
        setLogs([]);
        setGeneratedHtml(null);
    };

    const handlePdfUpload = async (file: File) => {
        setPdfProcessing(true);
        addLog(`جاري معالجة الملف: ${file.name}...`);
        try {
            const { text: pdfText } = await pdfService.extractFromPdf(file);
            await dbService.addPdfData({ filename: file.name, text: pdfText });
            addLog(`✔ تم حفظ "${file.name}" في المخزن بنجاح.`, 'success');
            setDataStoreRefreshKey(prev => prev + 1);
        } catch (error: any) {
            addLog(`❌ فشلت معالجة الملف: ${error.message}`, 'error');
        } finally {
            setPdfProcessing(false);
        }
    };

    const handleSelectPdf = async (id: number | null) => {
        setSelectedPdfId(id);
        if (id !== null) {
            resetGenerationState();
            setMainStatus(AppStatus.IDLE);
            const pdf = await dbService.getPdfData(id);
            setActiveDocumentText(pdf ? pdf.text : null);
        } else {
            setActiveDocumentText(null);
        }
    };

    const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setSourceText(newText);
        setActiveDocumentText(newText.trim() ? newText : null);
    };

    const handleStartGeneration = async () => {
        if (!activeDocumentText) {
            if(generationMode === 'pdf') addLog("الرجاء تحديد ملف من المخزن أولاً.", 'error');
            else addLog("الرجاء إدخال النص الطبي المصدر أولاً.", 'error');
            return;
        }

        resetGenerationState();
        setMainStatus(AppStatus.GENERATING);

        try {
            addLog('بدأت عملية التنفيذ.');

            const sourceDescription = generationMode === 'pdf' ? `سحب بيانات الملف المحدد` : `تحليل النص المصدر`;
            updateProtocolStatus('p0', ProtocolStatus.ACTIVE, `البروتوكول 0: ${sourceDescription}`);
            addLog(`✔ تم تجهيز البيانات المصدر بنجاح.`, 'success');
            updateProtocolStatus('p0', ProtocolStatus.DONE);

            updateProtocolStatus('p1', ProtocolStatus.ACTIVE);
            addLog("1. بدء البروتوكول 1: توليد المحتوى الطبي...");
            const { questions: generatedQuestions, images: returnedImages } = await geminiService.generateQuizContent(activeDocumentText, uploadedImages, generationConfig.customInstructions, generationConfig.mcqCount, generationConfig.caseCount, generationConfig.questionsPerCase, generationConfig.difficulty);
            addLog(`✔ اكتمل البروتوكول 1: تم إنشاء ${generatedQuestions.length} سؤالًا.`, 'success');
            updateProtocolStatus('p1', ProtocolStatus.DONE);
            let currentData: GeneratedQuizData = { questions: generatedQuestions, images: returnedImages };

            updateProtocolStatus('p2', ProtocolStatus.ACTIVE);
            addLog("2. بدء البروتوكول 2: تصحيح توزيع الإجابات (بالخلط العشوائي).");
            currentData.questions.sort(() => Math.random() - 0.5);
            addLog(`✔ اكتمل البروتوكول 2.`, 'success');
            updateProtocolStatus('p2', ProtocolStatus.DONE);

            updateProtocolStatus('p2.8', ProtocolStatus.ACTIVE);
            addLog("2.8. بدء البروتوكول 2.8: التدقيق النقدي والتصحيح الآلي.");
            // Changed from Promise.all to sequential processing
            const auditedQuestions: QuizQuestion[] = [];
            for (const q of currentData.questions) {
                addLog(`تدقيق السؤال: ${q.question.substring(0, 50)}...`);
                const auditedQ = await geminiService.auditAndCorrectQuestion(q, activeDocumentText, currentData.images);
                auditedQuestions.push(auditedQ);
            }
            currentData.questions = auditedQuestions;
            addLog(`✔ اكتمل البروتوكول 2.8.`, 'success');
            updateProtocolStatus('p2.8', ProtocolStatus.DONE);

            updateProtocolStatus('p2.7', ProtocolStatus.ACTIVE);
            addLog("2.7. بدء البروتوكول 2.7: تدقيق وتحسين التفسيرات.");
            // Changed from Promise.all to sequential processing
            const refinedQuestions: QuizQuestion[] = [];
            for (const q of currentData.questions) {
                addLog(`تحسين تفسير السؤال: ${q.question.substring(0, 50)}...`);
                const refinedQ = await geminiService.refineExplanation(q, activeDocumentText, currentData.images);
                refinedQuestions.push(refinedQ);
            }
            currentData.questions = refinedQuestions;
            addLog(`✔ اكتمل البروتوكول 2.7.`, 'success');
            updateProtocolStatus('p2.7', ProtocolStatus.DONE);

            updateProtocolStatus('p3', ProtocolStatus.ACTIVE);
            addLog("3. بدء البروتوكول 3: توليد كود HTML للاختبار.");
            const finalHtml = htmlGenerator.generateQuizHtml(currentData);
            setGeneratedHtml(finalHtml);
            addLog(`✔ اكتمل البروتوكول 3.`, 'success');
            updateProtocolStatus('p3', ProtocolStatus.DONE);

            updateProtocolStatus('p4', ProtocolStatus.ACTIVE);
            addLog("4. بدء البروتوكول 4: المراجعة النهائية والختام.");
            updateProtocolStatus('p4', ProtocolStatus.DONE);

            setMainStatus(AppStatus.DONE_GENERATING);
            addLog("✅ اكتملت جميع البروتوكولات بنجاح! الاختبار جاهز للمعاينة والتنزيل.", 'success');

        } catch (error: any) {
            const errorMessage = error.message || 'حدث خطأ غير معروف.';
            setMainStatus(AppStatus.ERROR);
            addLog(`❌ خطأ فادح: ${errorMessage}`, 'error');
            const activeStep = protocolSteps.find(s => s.status === 'active');
            if (activeStep) updateProtocolStatus(activeStep.id, ProtocolStatus.ERROR);
        }
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setGenerationConfig({
            ...generationConfig,
            [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value
        });
    };

    const handleReturnToChoice = () => {
        setGenerationMode(null);
        resetGenerationState();
        setMainStatus(AppStatus.IDLE);
        setSelectedPdfId(null);
        setSourceText('');
        setUploadedImages([]);
        setActiveDocumentText(null);
    };

    const isGenerating = mainStatus === AppStatus.GENERATING;

    const renderGenerationSettings = () => (
         <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
             <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">4. إعدادات التوليد</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                    <label htmlFor="mcqCount" className="block text-white text-sm font-bold mb-2">عدد MCQ:</label>
                    <input type="number" id="mcqCount" name="mcqCount" value={generationConfig.mcqCount} onChange={handleConfigChange} min="0" className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={isGenerating} />
                </div>
                <div>
                    <label htmlFor="caseCount" className="block text-white text-sm font-bold mb-2">عدد الحالات:</label>
                    <input type="number" id="caseCount" name="caseCount" value={generationConfig.caseCount} onChange={handleConfigChange} min="0" className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={isGenerating} />
                </div>
                <div>
                    <label htmlFor="questionsPerCase" className="block text-white text-sm font-bold mb-2">أسئلة لكل حالة:</label>
                    <input type="number" id="questionsPerCase" name="questionsPerCase" value={generationConfig.questionsPerCase} onChange={handleConfigChange} min="1" max="5" className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={isGenerating} />
                </div>
                <div>
                    <label htmlFor="difficulty" className="block text-white text-sm font-bold mb-2">مستوى الصعوبة:</label>
                    <select id="difficulty" name="difficulty" value={generationConfig.difficulty} onChange={handleConfigChange} className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={isGenerating}>
                        <option value="mix">مزيج (افتراضي)</option>
                        <option value="easy">سهل</option>
                        <option value="medium">متوسط</option>
                        <option value="hard">صعب</option>
                    </select>
                </div>
             </div>
              <div className="mb-6">
                <label htmlFor="customInstructions" className="block text-white text-sm font-bold mb-2">تعليمات إضافية (اختياري):</label>
                <textarea id="customInstructions" name="customInstructions" rows={3} value={generationConfig.customInstructions} onChange={handleConfigChange} className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="مثال: ركز على أسئلة التشخيص، استخدم الصور المرفقة، اجعل الأسئلة قصيرة..." disabled={isGenerating}></textarea>
            </div>

             <button onClick={handleStartGeneration} disabled={isGenerating} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 flex items-center justify-center disabled:bg-slate-500 disabled:cursor-not-allowed">
                 <span>{isGenerating ? 'جاري التنفيذ...' : 'ابدأ التنفيذ الآن'}</span>
                 {isGenerating && <div id="loader" style={{display: 'inline-block', marginLeft: '8px'}}></div>}
             </button>
         </div>
    );

    const renderDashboard = () => (
        <main className="flex flex-col gap-8">
            <button onClick={handleReturnToChoice} className="self-start flex items-center gap-2 text-cyan-400 hover:text-cyan-200 transition-colors font-semibold">
                <ArrowRightIcon className="w-5 h-5"/>
                <span>العودة إلى شاشة الاختيار</span>
            </button>

            {generationMode === 'pdf' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                        <ControlPanel onPdfUpload={handlePdfUpload} isProcessing={pdfProcessing} isDisabled={isGenerating} />
                        <DataStoreViewer onSelectPdf={handleSelectPdf} selectedPdfId={selectedPdfId} refreshKey={dataStoreRefreshKey} />
                    </div>
                    {activeDocumentText && !isGenerating && <ChatWithDoc documentText={activeDocumentText} />}
                    {selectedPdfId !== null && (
                        <>
                            <ImageUploader onImagesChange={setUploadedImages} isDisabled={isGenerating} />
                            {renderGenerationSettings()}
                        </>
                    )}
                </>
            ) : (
                 <>
                    <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
                         <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">1. أدخل النص الطبي</h3>
                         <textarea
                             value={sourceText}
                             onChange={handleSourceTextChange}
                             rows={10}
                             className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                             placeholder="ألصق النص الطبي الكامل هنا..."
                             disabled={isGenerating}
                         />
                    </div>
                    {activeDocumentText && !isGenerating && <ChatWithDoc documentText={activeDocumentText} />}
                    <ImageUploader onImagesChange={setUploadedImages} isDisabled={isGenerating} />
                    {renderGenerationSettings()}
                 </>
            )}

            {(logs.length > 0) && (
                <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1"><ProtocolTracker steps={protocolSteps} /></div>
                        <div className="md:col-span-2"><LogOutput logs={logs} /></div>
                    </div>
                </div>
            )}

            {mainStatus === AppStatus.DONE_GENERATING && generatedHtml && (
                <OutputViewer htmlContent={generatedHtml} />
            )}
        </main>
    );

    const renderInitialChoice = () => (
        <main className="page text-center container-glass p-8 rounded-lg max-w-4xl mx-auto text-slate-800">
             <h2 className="text-3xl font-bold mb-4">كيف تريد إنشاء الاختبار؟</h2>
             <p className="text-lg text-slate-600 mb-8">اختر الطريقة التي تفضلها لتوفير المادة العلمية.</p>
             <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button
                    onClick={() => setGenerationMode('text')}
                    className="flex-1 btn-primary font-bold py-6 px-8 rounded-lg text-xl transition-transform hover:scale-105"
                >
                    توليد من نص
                </button>
                 <button
                    onClick={() => setGenerationMode('pdf')}
                    className="flex-1 btn-primary font-bold py-6 px-8 rounded-lg text-xl transition-transform hover:scale-105"
                    style={{backgroundColor: '#005a9e'}}
                >
                    توليد من ملف PDF
                </button>
             </div>
        </main>
    );

    const renderContent = () => {
        if (generationMode === null) {
            return renderInitialChoice();
        }
        return renderDashboard();
    };

    const getStatusBadgeClass = () => {
        switch (mainStatus) {
            case AppStatus.GENERATING: return 'status-processing';
            case AppStatus.DONE_GENERATING: return 'status-done';
            case AppStatus.ERROR: return 'status-error';
            case AppStatus.PROCESSING_PDF: return 'status-processing';
            default: return pdfProcessing ? 'status-processing' : 'status-ready';
        }
    };

    const getStatusText = () => {
        if(pdfProcessing) return 'جاري معالجة PDF...';
        if(mainStatus === AppStatus.GENERATING) return 'جاري توليد الأسئلة...';
        if(mainStatus === AppStatus.DONE_GENERATING) return 'اكتمل التوليد';
        if(mainStatus === AppStatus.ERROR) return 'حدث خطأ';
        if(mainStatus === AppStatus.IDLE) return 'جاهز';
        return 'غير معروف';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
            <header className="w-full max-w-4xl text-center mb-8">
                <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-4">WATFA-PEDIA</h1>
                <p className="text-xl text-cyan-300 mb-6">نظام توليد الاختبارات الطبية بالذكاء الاصطناعي</p>
                <div className={`status-badge ${getStatusBadgeClass()}`}>{getStatusText()}</div>
            </header>
            {renderContent()}
            <footer className="mt-12 text-center text-slate-400 text-sm">
                <p>&copy; 2025 WATFA-PEDIA. جميع الحقوق محفوظة.</p>
                <a href="https://t.me/watfapedia_major" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center py-2 px-4 mt-4 rounded-full bg-slate-700 text-cyan-400 no-underline transition-transform hover:scale-105 shadow-md">
                    <TelegramIcon className="w-5 h-5 ml-2"/>
                    <span>اشترك في قناة WATFA-PEDIA</span>
                </a>
            </footer>
        </div>
    );
};

export default App;
