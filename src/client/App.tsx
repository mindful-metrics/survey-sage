import { useState, type KeyboardEventHandler } from "react";
import { Chat } from "./Chat";
import { ChatIcon } from "./ChatIcon";
import { ChatMessage } from "./ChatMessage";
import { ChatText } from "./ChatText";
import "./index.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "How are you this morning?" },
    { role: "user", content: "I'm doing good" },
  ]);

  const handleSubmit: KeyboardEventHandler = async (event) => {
    const message = (event.target as HTMLInputElement).value;
    if (event.key !== "Enter" || !message.trim()) {
      return;
    }


    setMessages([...messages, { role: "user", content: message }]);

    (event.target as HTMLInputElement).value = "";

    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: messages,
      }),
    });

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.content },
    ]);
  };

  return (
    <div className="min-h-screen">
      <div
        id="chat-interface-background"
        className="max-w-7xl mx-auto h-100 p-8 m-8 rounded-xl text-center relative z-10"
      >
        <div className="size-full mx-auto rounded-xl bg-white/75">
          <h1 className="text-5xl font-bold my-4 leading-tight">Good Morning!</h1>
          <div className="lg:p-32">
            <Chat className="flex-row gap-2">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  className={
                    message.role === "assistant"
                      ? "w-full flex-row gap-2 inline-flex items-center"
                      : "w-full flex-row-reverse gap-2 inline-flex items-center"
                  }
                >
                  <ChatIcon />
                  <ChatText
                    role={message.role}
                    className={
                      message.role === "assistant"
                        ? "bg-white max-w-sm rounded-t-xl rounded-br-xl p-1"
                        : "bg-white max-w-sm rounded-t-xl rounded-bl-xl p-1"
                    }
                  >
                    {message.content}
                  </ChatText>
                </ChatMessage>
              ))}

              <div className="w-full min-h-6 bg-white rounded-xl p-2 mt-4">
                <input
                  className="w-full"
                  onKeyDown={handleSubmit}
                />
              </div>
            </Chat>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;