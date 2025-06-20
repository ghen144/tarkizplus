import React, { useState } from 'react';


const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMsg = { role: "user", content: input };
        setMessages(prev => [...prev, newMsg]);

        try {
            const response = await fetch("/api/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: input })  // match your FastAPI model
            });

            const data = await response.json();
            const botMsg = { role: "assistant", content: data.answer };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "❌ Oops! Something went wrong. Try again later."
            }]);
        }

        setInput("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white border rounded-lg shadow-xl flex flex-col p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold">Assistant</h2>
                        <button onClick={() => setIsOpen(false)}>✖️</button>
                    </div>
                    <div className="flex-1 overflow-y-auto mb-2 space-y-2">
                        {messages.map((msg, i) => (
                            <div key={i} className={`text-sm p-2 rounded ${msg.role === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"}`}>
                                {msg.content}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            className="border rounded w-full px-2 py-1 text-sm"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                        />
                        <button onClick={sendMessage} className="bg-blue-600 text-white px-3 rounded">Send</button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition"
            >
                💬
            </button>
        </div>
    );
};

export default ChatWidget;
