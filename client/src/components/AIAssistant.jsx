import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';

const AIAssistant = ({ eventId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! I am your Evora AI assistant. Ask me anything about events, timings, pricing, or recommendations!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const { data } = await api.post('/gemini/chat', { message: userMsg, eventId });
            setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to AI services right now.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl shadow-2xl hover:scale-110 transition duration-300">
                    <FaRobot />
                </motion.button>
            )}

            {/* Chat Box */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-80 sm:w-96 bg-white dark:bg-dark-600 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-400 overflow-hidden flex flex-col h-[480px]">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold">
                                <img src="/logo.png" alt="Evora AI" className="w-8 h-8 object-contain filter drop-shadow" />
                                <span>Evora AI Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:opacity-80 p-1"><FaTimes /></button>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${m.sender === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-dark-500 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-dark-500 p-3 rounded-2xl rounded-bl-none text-xs text-gray-400 animate-pulse">
                                        AI is thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-dark-400 flex gap-2">
                            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask AI anything..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                            <button type="submit" disabled={loading} className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition font-bold disabled:opacity-50">
                                <FaPaperPlane className="text-sm" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIAssistant;
