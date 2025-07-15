import React, { useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMsg = { role: "user", content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch("https://tarkizhelpbot.onrender.com/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: input })
            });

            const data = await response.json();
            const botMsg = { role: "assistant", content: data.answer };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Something went wrong. Try again later."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex flex-col items-end ${
                isOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
        >
            {/* Chat Bubble */}
            <div
                className={`transition-all duration-300 ease-in-out transform origin-bottom ${
                    isOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95"
                }`}
            >
                <div className="w-[350px] h-[500px] bg-white border rounded-2xl shadow-2xl flex flex-col p-4 mb-3">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold text-gray-800">Assistant</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-red-500 text-lg"
                        >
                            ×
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`max-w-[80%] px-4 py-2 text-sm rounded-2xl whitespace-pre-wrap ${
                                    msg.role === "user"
                                        ? "ml-auto bg-blue-600 text-white"
                                        : "mr-auto bg-gray-200 text-gray-900"
                                }`}
                            >
                                {msg.content}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="mr-auto bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-2xl w-fit animate-pulse">
                                Typing...
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            className="border rounded-full w-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

            {/* Toggle Button — always clickable */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center text-xl transition pointer-events-auto"
                aria-label="Open chat"
            >
                <FiMessageSquare />
            </button>
        </div>
    );

};

export default ChatWidget;
