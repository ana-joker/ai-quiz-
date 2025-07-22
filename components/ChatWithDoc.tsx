
import React, { useState, useRef, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import { SendIcon } from './Icons';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

interface ChatWithDocProps {
    documentText: string;
}

const ChatWithDoc: React.FC<ChatWithDocProps> = ({ documentText }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        // Add a placeholder for the AI response
        setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

        try {
            const stream = await geminiService.generateAnswerStream(documentText, currentInput);
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'ai') {
                        lastMessage.text += chunkText;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    lastMessage.text = "عفوًا، حدث خطأ أثناء التواصل مع النموذج. الرجاء المحاولة مرة أخرى.";
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">أسئلة سريعة حول المستند</h3>
            <div className="h-80 bg-slate-900/50 rounded-lg p-4 overflow-y-auto flex flex-col gap-4 mb-4">
                {messages.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-slate-400">اطرح سؤالاً للبدء...</div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-lg whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                {msg.text}
                                {isLoading && msg.sender === 'ai' && index === messages.length -1 && <span className="inline-block w-2 h-2 ml-1 bg-white rounded-full animate-pulse"></span>}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="اسأل عن أي شيء في المستند..."
                    className="flex-grow bg-slate-700 border-slate-600 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-5 rounded-lg transition duration-300 flex items-center justify-center disabled:bg-slate-500 disabled:cursor-not-allowed"
                    aria-label="إرسال"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default ChatWithDoc;
