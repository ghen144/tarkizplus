import React, { useState, useRef, useEffect } from "react";

const TarkizCompass = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);

    const sendQuery = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        try {
            const response = await fetch("http://localhost:8001/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input })
            });

            const data = await response.json();
            const botMessage = { role: "bot", content: data.answer };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMsg = { role: "bot", content: "⚠️ Error connecting to the server." };
            setMessages((prev) => [...prev, errorMsg]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendQuery();
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-[80vh] max-w-2xl mx-auto border rounded-lg shadow bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-xl max-w-[80%] ${
                            msg.role === "user"
                                ? "bg-blue-100 self-end ml-auto text-right"
                                : "bg-gray-200 self-start"
                        }`}
                    >
                        {msg.content}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-white border-t flex gap-2">
                <input
                    type="text"
                    placeholder="Ask me anything..."
                    className="flex-1 p-2 border rounded focus:outline-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={sendQuery}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default TarkizCompass;
