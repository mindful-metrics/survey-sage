import { useMemo, useState, type KeyboardEventHandler } from "react";
import { Chat } from "./Chat";
import { ChatIcon } from "./ChatIcon";
import { ChatMessage } from "./ChatMessage";
import { ChatText } from "./ChatText";
import "./index.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ServerResponse = {
  action: 'followup' | 'submit' | 'error'
  content: string
  answers?: Record<string, string>
}

export function App() {
  const taskId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('taskId') ?? 'local-task'
  }, [])

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi, thanks for taking the time to speak with me today. I'm going to ask you some questions about how you've been feeling over the past week — there are no right or wrong answers. Over the last two weeks, how often have you been bothered by feeling nervous, anxious, or on edge? Please answer with: not at all, several days, more than half the days, or nearly every day.`,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const postMessages = async (nextMessages: Message[]) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: nextMessages,
          taskId,
        })
      })

      const data = (await response.json()) as ServerResponse

      if (!response.ok || data.action === 'error') {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: data.content || 'Something went wrong while processing your response.',
          }
        ])
        return
      }

      if (data.action === 'submit') {
        setIsComplete(true)
      }

      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: data.content,
        },
      ])
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'Could not connect to the server. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit: KeyboardEventHandler<HTMLInputElement> = async (event) => {
    const input = event.currentTarget
    const message = input.value.trim()

    if (event.key !== "Enter" || !message || isLoading || isComplete) {
      return
    }

    input.value = ''

    const nextMessages: Message[] = [
      ...messages,
      {
        role: 'user',
        content: message,
      },
    ]

    setMessages(nextMessages)
    await postMessages(nextMessages)
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
                  key={`${message.role}-${index}`}
                  className={
                    message.role === 'assistant'
                      ? 'w-full flex-row gap-2 inline-flex items-center text-left'
                      : 'w-full flex-row-reverse gap-2 inline-flex items-center text-right'
                  }
                >
                  <ChatIcon />
                  <ChatText
                    role={message.role}
                    className={
                      message.role === 'assistant'
                        ? 'bg-white max-w-sm rounded-t-xl rounded-br-xl p-2'
                        : 'bg-white max-w-sm rounded-t-xl rounded-bl-xl p-2'
                    }
                  >
                    {message.content}
                  </ChatText>
                </ChatMessage>
              ))}

              {isLoading && (
                <ChatMessage className="w-full flex-row gap-2 inline-flex items-center text-left">
                  <ChatIcon />
                  <ChatText role="assistant" className="bg-white max-w-sm rounded-t-xl rounded-br-xl p-2">
                    Thinking...
                  </ChatText>
                </ChatMessage>
              )}

              <div className="w-full min-h-6 bg-white rounded-xl p-2 mt-4">
                <input
                  className="w-full outline-none disabled:opacity-50"
                  onKeyDown={handleSubmit}
                  disabled={isLoading || isComplete}
                  placeholder={isComplete ? 'Survey complete' : 'Type your answer and press Enter'}
                />
              </div>
            </Chat>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App;