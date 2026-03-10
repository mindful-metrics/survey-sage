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
    {
      role: "assistant",
      content: `Hi, thanks for taking the time to speak with me today. I'm going to ask you some questions about how you've been feeling over the past week — there are no right or wrong answers. How has your mood been lately?`,
    },
  ]);

  const handleSubmit: KeyboardEventHandler = async (event) => {
    const message = (event.target as HTMLInputElement).value;
    if (event.key !== "Enter" || !message.trim()) {
      return;
    }

    const postMessages = async (messages: Message[]) => {
      await fetch("/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: messages,
          taskId: '1'
        }),
      })
        .then(data => data.json())
        .then(data => {
          setMessages([...messages, { role: "assistant", content: data.content }])
        });
    };

    setMessages((prev) => {
      (event.target as HTMLInputElement).value = "";
      const messages = [
        ...prev,
        { role: "user", content: message } as Message,
      ];
      postMessages(messages);
      return messages
    });
  }

  return (
    <div className="min-h-screen">
      <div
        id="chat-interface-background"
        className="max-w-7xl mx-auto p-8 m-8 rounded-xl text-center relative z-10"
      >
        <div className="size-full mx-auto min-h-96 rounded-xl bg-white/75 flex-row">
          <h1 className="text-5xl font-bold my-4 leading-tight">Good Morning!</h1>
          <div className="lg:p-4 h-full">
            <Chat className="flex-row gap-2">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  className={
                    message.role === "assistant"
                      ? "w-full flex-row gap-2 inline-flex items-center text-left"
                      : "w-full flex-row-reverse gap-2 inline-flex items-center text-right"
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