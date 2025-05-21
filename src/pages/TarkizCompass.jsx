// src/components/TarkizCompass.jsx
import { useState } from "react";
import axios from "axios";

export default function TarkizCompass() {
    const [messages, setMessages] = useState([
        { text: "Hi! I'm TarkizCompass. Ask me about a student! 💡", isUser: false }
    ]);
    const [input, setInput] = useState("");

    const handleSend = async () => {
        // Add loading state
        setMessages([...messages, { text: input, isUser: true }]);
        setInput("");

        try {
            const response = await axios.post("http://localhost:3001/tarkiz-compass", {
                question: input,
                student_id: "123" // Replace with dynamic data later
            });
            setMessages(prev => [...prev, { text: response.data.reply, isUser: false }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Oops! TarkizCompass is tired. Try again later. 😴", isUser: false }]);
        }
    };

    return (
        <div className="tarkiz-compass-chat">
            <div className="messages">
                {messages.map((msg, i) => (
                    <div key={i} className={msg.isUser ? "user-msg" : "compass-msg"}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask TarkizCompass about a student..."
                />
                <button onClick={handleSend}>🔮 Get Recommendation</button>
            </div>
        </div>
    );
}