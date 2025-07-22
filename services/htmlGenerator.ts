import { GeneratedQuizData } from '../types';
import { SUCCESS_MESSAGES, FAILURE_MESSAGES } from '../constants';

export const generateQuizHtml = (quizData: GeneratedQuizData, partIndex: number = 1): string => {
    // Escape backticks, backslashes, and template literal syntax in the JSON string
    const sanitizedQuizData = JSON.stringify(quizData, null, 2)
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    // Use a unique function name to avoid potential conflicts if multiple quizzes are on one page.
    const uniqueId = "quizApp" + Date.now();

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WATFA-PEDIA Medical Quiz (Part ${partIndex})</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --ms-blue: #0078D4; --ms-light-blue: #DEECF9; --ms-dark-blue: #005A9E;
            --ms-correct-green: #107C10; --ms-incorrect-red: #D83B01;
            --ms-correct-bg: #DFF6DD; --ms-incorrect-bg: #FDE7E9;
            --ms-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        body { font-family: 'Segoe UI', 'Tajawal', sans-serif; color: #323130; background-color: #f0f2f5; }
        .app-bg {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(45deg, #1d2b64, #f8cdda, #1d2b64, #f8cdda);
            background-size: 300% 300%; animation: animated-gradient 20s ease-in-out infinite; z-index: -1;
        }
        @keyframes animated-gradient { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
        
        .container-main { background-color: #ffffff; text-align: right; }
        .page { display: none; }
        .page.active { display: block; animation: page-fade-in .5s ease-out forwards; }
        @keyframes page-fade-in { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        
        .question-card, .case-card { background-color: #ffffff; border: 1px solid #e5e7eb; }
        .option-label { cursor: pointer; padding: .75rem; border: 2px solid #e5e7eb; border-radius: .375rem; transition: all .2s; }
        .option-label:hover { border-color: var(--ms-blue); background-color: var(--ms-light-blue); }
        
        .review-page .option-label.correct-answer { background-color: var(--ms-correct-bg) !important; border-color: var(--ms-correct-green) !important; }
        .review-page .option-label.incorrect-answer { background-color: var(--ms-incorrect-bg) !important; border-color: var(--ms-incorrect-red) !important; }
        .basmaja-page .basmaja-correct-answer { background-color: var(--ms-correct-bg) !important; border-color: var(--ms-correct-green) !important; }

        .btn-primary { background-color: var(--ms-blue); color: white; transition: all .3s ease; box-shadow: 0 2px 4px rgba(0,0,0,.2); }
        .btn-primary:hover { background-color: var(--ms-dark-blue); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,.2); }
        .btn-secondary { background-color: #6c757d; color: white; }
        
        .flawed-question-warning { background-color: #fffbeb; border-right: 4px solid #f59e0b; color: #b45309; padding: .75rem; margin-bottom: 1rem; border-radius: .375rem; }
    </style>
</head>
<body class="text-slate-800">
    <div class="app-bg"></div>
    <div id="app-container" class="max-w-4xl mx-auto p-4 md:p-8">
        <!-- All pages will be rendered here by JS -->
    </div>

<script type="module">
    // --- Start of Quiz Application ---
    function ${uniqueId}() {
        const quizData = JSON.parse(\`${sanitizedQuizData}\`);
        const successMessages = ${JSON.stringify(SUCCESS_MESSAGES)};
        const failureMessages = ${JSON.stringify(FAILURE_MESSAGES)};

        const appContainer = document.getElementById('app-container');
        let userAnswers = [];
        let currentPage = 'landing';

        function render() {
            appContainer.innerHTML = '';
            let pageElement;
            switch(currentPage) {
                case 'quiz': pageElement = createQuizPage(); break;
                case 'results': pageElement = createResultsPage(); break;
                case 'review': pageElement = createReviewPage(); break;
                case 'basmaja': pageElement = createBasmajaPage(); break;
                case 'landing':
                default: pageElement = createLandingPage(); break;
            }
            if (pageElement) {
                appContainer.appendChild(pageElement);
            }
        }

        function createLandingPage() {
            const page = document.createElement('div');
            page.className = 'page active text-center container-main p-8 rounded-lg shadow-lg';
            page.innerHTML = \`
                <h1 class="text-4xl font-bold mb-2">WATFA-PEDIA Medical Quiz</h1>
                <h2 class="text-2xl text-gray-600 mb-4">Part ${partIndex}</h2>
                <p class="mb-8">اختبر معلوماتك في المفاهيم الطبية المقدمة.</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button id="start-quiz-btn" class="btn-primary font-bold py-3 px-8 rounded-lg text-lg">ابدأ الاختبار</button>
                    <button id="basmaja-btn" class="btn-secondary font-bold py-3 px-8 rounded-lg text-lg" style="font-family:'Tajawal',sans-serif">💡 بصمجة</button>
                </div>
                <a href="https://t.me/watfapedia_major" target="_blank" class="inline-flex items-center justify-center py-2 px-4 mt-4 rounded-full bg-slate-100 text-cyan-600 no-underline transition-transform hover:scale-105 shadow-md"><svg class="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg><span>اشترك في قناة WATFA-PEDIA</span></a>
            \`;
            page.querySelector('#start-quiz-btn').addEventListener('click', () => {
                userAnswers = quizData.questions.map((q, index) => ({ questionIndex: index, selectedOption: null, isCorrect: null, isFlawed: q.is_flawed }));
                currentPage = 'quiz';
                render();
            });
            page.querySelector('#basmaja-btn').addEventListener('click', () => {
                currentPage = 'basmaja';
                render();
            });
            return page;
        }

        function createQuizPage() {
            const page = document.createElement('div');
            page.className = 'page active';
            let currentQIndex = 0;

            const renderQuestion = () => {
                page.innerHTML = ''; // Clear previous question
                const validQuestions = quizData.questions.filter(q => !q.is_flawed);
                if (currentQIndex >= validQuestions.length) {
                    currentPage = 'results';
                    render();
                    return;
                }
                const question = validQuestions[currentQIndex];
                if (!question) return;

                const originalIndex = quizData.questions.indexOf(question);
                const answerState = userAnswers.find(a => a.questionIndex === originalIndex);
                const showFeedback = answerState.selectedOption !== null;
                const questionImage = question.imageIndex != null ? quizData.images[question.imageIndex] : null;

                let optionsHtml = '';
                question.options.forEach((option, optIndex) => {
                    const isSelected = answerState.selectedOption === optIndex;
                    const isCorrectAnswer = question.correctAnswerIndex === optIndex;
                    let optionClass = "option-label block";

                    if (showFeedback) {
                        optionClass += " cursor-not-allowed";
                        if (isCorrectAnswer) optionClass += " bg-green-100 border-green-500 text-green-800 font-bold";
                        else if (isSelected) optionClass += " bg-red-100 border-red-500 text-red-800";
                        else optionClass += " border-gray-200 bg-gray-50 opacity-60";
                    } else {
                        optionClass += " border-gray-300 hover:bg-blue-50 hover:border-blue-400";
                        if (isSelected) optionClass += " bg-blue-100 border-blue-500";
                    }
                    optionsHtml += '<div data-opt-index="' + optIndex + '" class="' + optionClass + '"><p class="p-3">' + String.fromCharCode(65 + optIndex) + '. ' + option + '</p></div>';
                });
                
                let caseHtml = question.caseDescription ? '<div class="case-card p-4 rounded-lg mb-4 bg-blue-50 border-r-4 border-blue-300"><h3 class="font-bold text-lg text-blue-800">الحالة السريرية</h3><p class="mt-2 text-gray-700">' + question.caseDescription + '</p></div>' : '';
                let imageHtml = questionImage ? '<div class="my-4 flex justify-center"><img src="' + questionImage + '" alt="Question visual" class="max-w-full md:max-w-md rounded-lg shadow-md" /></div>' : '';

                let feedbackHtml = '';
                if(showFeedback){
                    const isCorrect = answerState.isCorrect;
                    feedbackHtml = '<div class="mt-4 p-4 rounded-lg border-r-4 ' + (isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500') + '">' +
                        '<h4 class="font-bold ' + (isCorrect ? 'text-green-800' : 'text-red-800') + '">' + 
                        (isCorrect ? "إجابة صحيحة! أحسنت." : 'إجابة خاطئة. الإجابة الصحيحة هي: ' + String.fromCharCode(65 + question.correctAnswerIndex)) + '</h4>' +
                        '<p class="text-gray-700 mt-2">' + question.explanation + '</p></div>';
                }
                
                let nextButtonHtml = (currentQIndex === validQuestions.length - 1 && showFeedback) ?
                    '<button id="finish-btn" class="btn-primary font-bold py-2 px-8 rounded-lg text-lg animate-pulse">إنهاء الاختبار</button>' :
                    '<button id="next-btn" ' + (!showFeedback || currentQIndex === validQuestions.length - 1 ? 'disabled' : '') + ' class="btn-primary font-bold py-2 px-6 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed">التالي</button>';

                const questionContainer = document.createElement('div');
                questionContainer.className = "container-main p-6 rounded-lg shadow-lg";
                questionContainer.innerHTML = \`
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: \${((currentQIndex + 1) / validQuestions.length) * 100}%"></div></div>
                    <div class="question-card p-6 rounded-lg mb-6">
                        \${caseHtml}
                        <p class="font-bold text-lg mb-4">السؤال \${currentQIndex + 1} من \${validQuestions.length}: \${question.question}</p>
                        \${imageHtml}
                        <div class="space-y-3 options-container">\${optionsHtml}</div>
                        \${feedbackHtml}
                    </div>
                    <div class="flex justify-between items-center mt-6">
                        <button id="prev-btn" \${currentQIndex === 0 ? 'disabled' : ''} class="btn-secondary font-bold py-2 px-6 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed">السابق</button>
                        \${nextButtonHtml}
                    </div>
                \`;
                page.appendChild(questionContainer);

                page.querySelector('.options-container').addEventListener('click', e => {
                     const target = e.target.closest('.option-label');
                     if (target && answerState.selectedOption === null) {
                        const optIndex = parseInt(target.dataset.optIndex, 10);
                        answerState.selectedOption = optIndex;
                        answerState.isCorrect = optIndex === question.correctAnswerIndex;
                        renderQuestion();
                     }
                });

                page.querySelector('#prev-btn')?.addEventListener('click', () => { if (currentQIndex > 0) { currentQIndex--; renderQuestion(); }});
                page.querySelector('#next-btn')?.addEventListener('click', () => { if (currentQIndex < validQuestions.length - 1) { currentQIndex++; renderQuestion(); }});
                page.querySelector('#finish-btn')?.addEventListener('click', () => { currentPage = 'results'; render(); });
            };
            
            renderQuestion();
            return page;
        }
        
        function createResultsPage() {
            const page = document.createElement('div');
            page.className = 'page active text-center container-main p-8 rounded-lg shadow-lg';
            
            const validQuestionsCount = userAnswers.filter(a => !a.isFlawed).length;
            const correctAnswersCount = userAnswers.filter(ans => ans.isCorrect).length;
            const percentage = validQuestionsCount > 0 ? (correctAnswersCount / validQuestionsCount) * 100 : 0;
            const message = percentage >= 60 ? successMessages[Math.floor(Math.random() * successMessages.length)] : failureMessages[Math.floor(Math.random() * failureMessages.length)];
            
            page.innerHTML = \`
                <h2 class="text-3xl font-bold mb-4">نتائج الاختبار</h2>
                <p class="text-xl mb-2">نتيجتك: <span class="font-bold">\${correctAnswersCount} / \${validQuestionsCount} (\${percentage.toFixed(1)}%)</span></p>
                <p class="text-lg font-semibold my-6 \${percentage >= 60 ? 'text-green-700' : 'text-red-700'}">\${message}</p>
                <div class="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    <button id="review-btn" class="btn-primary font-bold py-2 px-6 rounded-lg">مراجعة الإجابات</button>
                    <button id="retake-btn" class="btn-secondary font-bold py-2 px-6 rounded-lg">إعادة الاختبار</button>
                    <button id="home-btn" class="btn-secondary font-bold py-2 px-6 rounded-lg">العودة للرئيسية</button>
                </div>
            \`;
            page.querySelector('#review-btn').addEventListener('click', () => { currentPage = 'review'; render(); });
            page.querySelector('#retake-btn').addEventListener('click', () => {
                userAnswers = quizData.questions.map((q, index) => ({ questionIndex: index, selectedOption: null, isCorrect: null, isFlawed: q.is_flawed }));
                currentPage = 'quiz';
                render();
            });
            page.querySelector('#home-btn').addEventListener('click', () => { currentPage = 'landing'; render(); });
            return page;
        }

        function createReviewPage() {
            const page = document.createElement('div');
            page.className = 'page active review-page container-main p-6 rounded-lg shadow-lg';
            
            let questionsHtml = '';
            quizData.questions.forEach((q, index) => {
                if (q.is_flawed) return;
                const userAnswer = userAnswers.find(a => a.questionIndex === index);
                const isCorrect = userAnswer.isCorrect;
                const questionImage = q.imageIndex != null ? quizData.images[q.imageIndex] : null;

                const optionsHtml = q.options.map((opt, optIndex) => {
                    let classes = "option-label block";
                    if (optIndex === q.correctAnswerIndex) classes += " correct-answer";
                    else if (userAnswer.selectedOption === optIndex) classes += " incorrect-answer";
                    return '<div class="' + classes + ' p-3 rounded-md border-2">' + String.fromCharCode(65 + optIndex) + '. ' + opt + '</div>';
                }).join("");

                questionsHtml += \`
                    <div class="question-card p-6 rounded-lg mb-6">
                        \${q.caseDescription ? \`<div class="case-card p-4 rounded-lg mb-4 bg-blue-50 border-r-4 border-blue-300"><h3 class="font-bold text-lg text-blue-800">الحالة السريرية</h3><p class="mt-2 text-gray-700">\${q.caseDescription}</p></div>\` : ''}
                        <p class="font-bold text-lg mb-2">السؤال \${index + 1}: \${q.question}</p>
                        <div class="font-semibold mb-4 \${isCorrect ? "text-green-600" : (userAnswer.selectedOption !== null ? "text-red-600" : "text-gray-600")}">
                            \${isCorrect ? "صحيح" : (userAnswer.selectedOption !== null ? "غير صحيح" : "لم تتم الإجابة")}
                        </div>
                        \${questionImage ? \`<div class="my-4 flex justify-center"><img src="\${questionImage}" alt="Question visual" class="max-w-full md:max-w-md rounded-lg shadow-md" /></div>\` : ''}
                        <div class="space-y-3">\${optionsHtml}</div>
                        \${q.explanation ? \`<div class="mt-4 p-4 bg-green-50 border-r-4 border-green-500 rounded-lg"><h4 class="font-bold text-green-800">التوضيح</h4><p class="text-gray-700 mt-2">\${q.explanation}</p></div>\` : ""}
                    </div>
                \`;
            });

            page.innerHTML = \`
                <h2 class="text-3xl font-bold mb-6 text-center" style="font-family:'Tajawal',sans-serif">مراجعة الإجابات</h2>
                <div class="space-y-6">\${questionsHtml}</div>
                <button id="back-to-results-btn" class="btn-primary w-full font-bold py-3 px-4 rounded-lg mt-6">العودة للنتائج</button>
            \`;
            page.querySelector('#back-to-results-btn').addEventListener('click', () => { currentPage = 'results'; render(); });
            return page;
        }

        function createBasmajaPage() {
            const page = document.createElement('div');
            page.className = 'page active basmaja-page container-main p-6 rounded-lg shadow-lg';
            
            let questionsHtml = '';
            quizData.questions.forEach((q, index) => {
                const questionImage = q.imageIndex != null ? quizData.images[q.imageIndex] : null;
                const optionsHtml = q.options.map((opt, optIndex) =>
                    '<div class="p-3 rounded-md border-2 ' + (optIndex === q.correctAnswerIndex ? 'basmaja-correct-answer' : 'border-gray-300') + '">' + String.fromCharCode(65 + optIndex) + '. ' + opt + '</div>'
                ).join("");
                questionsHtml += \`
                    <div class="question-card p-6 rounded-lg mb-6">
                        \${q.is_flawed ? '<div class="flawed-question-warning"><strong>ملاحظة:</strong> هذا السؤال قيد المراجعة.</div>' : ''}
                        \${q.caseDescription ? \`<div class="case-card p-4 rounded-lg mb-4 bg-blue-50 border-r-4 border-blue-300"><h3 class="font-bold text-lg text-blue-800">الحالة السريرية</h3><p class="mt-2 text-gray-700">\${q.caseDescription}</p></div>\` : ''}
                        <p class="font-bold text-lg mb-4">السؤال \${index + 1}: \${q.question}</p>
                        \${questionImage ? \`<div class="my-4 flex justify-center"><img src="\${questionImage}" alt="Question visual" class="max-w-full md:max-w-md rounded-lg shadow-md" /></div>\` : ''}
                        <div class="space-y-3">\${optionsHtml}</div>
                        \${q.explanation ? \`<div class="mt-4 p-4 bg-green-50 border-r-4 border-green-500 rounded-lg"><h4 class="font-bold text-green-800">التوضيح</h4><p class="text-gray-700 mt-2">\${q.explanation}</p></div>\` : ""}
                    </div>
                \`;
            });

            page.innerHTML = \`
                <h2 class="text-3xl font-bold mb-6 text-center" style="font-family:'Tajawal',sans-serif">📚 بصمجة - كل الأسئلة والأجوبة</h2>
                <div>\${questionsHtml}</div>
                <button id="back-to-home-btn" class="btn-primary w-full font-bold py-3 px-4 rounded-lg mt-6">العودة للبداية</button>
            \`;
            page.querySelector('#back-to-home-btn').addEventListener('click', () => { currentPage = 'landing'; render(); });
            return page;
        }

        // Initial render
        render();
    }
    // Run the app
    ${uniqueId}();
<\/script>
</body>
</html>`;
    return html;
};
