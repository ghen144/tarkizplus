import React, {useState, useRef, useEffect} from "react";

const TarkizCompass = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [showIntro, setShowIntro] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);
    const userRole = localStorage.getItem('userRole');

    const sendQuery = async () => {
        if (!input.trim()) return;
        if (showIntro) setShowIntro(false);

        const userMessage = {role: "user", content: input};
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch("https://tarkizcompassdocker.onrender.com/query", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text: input, role: userRole})

            });

            const data = await response.json();
            const botMessage = {role: "bot", content: data.answer};
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMsg = {role: "bot", content: "Error connecting to the server."};
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendQuery();
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages, isTyping]);

    return (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col relative bg-white rounded shadow z-0">
            {/* Intro Message Overlay */}
            {showIntro && (
                <div className="absolute inset-0 z-10 bg-white flex items-center justify-center animate-fade-in-up">
                    <div className="flex flex-col items-center text-center px-4 space-y-4">
                        <h2 className="text-2xl font-semibold text-gray-700">
                            Welcome to Tarkiz Compass!
                        </h2>
                        <p className="text-gray-600 max-w-lg">
                            I'm here to help you explore student insights, match teachers to learners, and make
                            data-backed
                            educational decisions, all based on real lesson and performance data.
                            <br className="hidden sm:block"/>
                            Just type a question to get started!
                        </p>
                    </div>
                </div>

            )}

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 z-0">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`w-full flex ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`inline-block px-4 py-3 rounded-xl text-sm sm:text-base transition-all duration-300 ease-in-out shadow max-w-[80%] break-words ${
                                msg.role === "user"
                                    ? "bg-blue-100 text-right animate-slide-in-right"
                                    : "bg-gray-100 text-left animate-slide-in-left"
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}


                {isTyping && (
                    <div
                        className="rounded-xl px-4 py-2 bg-gray-200 self-start animate-pulse w-fit text-sm italic text-gray-600">
                        Typing...
                    </div>
                )}

                <div ref={chatEndRef}/>
            </div>

            {/* Input Bar */}
            <div className="sticky bottom-0 z-20 bg-white border-t px-4 py-3 flex justify-center">
                <div className="w-full max-w-xl flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={sendQuery}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TarkizCompass;
