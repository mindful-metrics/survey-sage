import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEventHandler } from "react";
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

  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  const submitDraft = async () => {
    const message = draft.trim()

    if (!message || isLoading || isComplete) {
      return
    }

    setDraft('')

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitDraft()
  }

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await submitDraft()
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section id="chat-interface-background" className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center rounded-[2rem] p-3 shadow-2xl shadow-slate-950/30 sm:p-6">
        <div className="flex h-[calc(100vh-6rem)] min-h-[640px] w-full flex-col overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/85 shadow-xl backdrop-blur-xl">
          <header className="border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Survey Sage</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Guided check-in</h1>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {isComplete ? 'Complete' : 'In progress'}
              </span>
            </div>
          </header>

          <Chat className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
            {messages.map((message, index) => (
              <ChatMessage
                key={`${message.role}-${index}`}
                className={message.role === 'assistant' ? 'justify-start' : 'justify-end'}
              >
                {message.role === 'assistant' && <ChatIcon role="assistant" />}
                <ChatText role={message.role}>{message.content}</ChatText>
                {message.role === 'user' && <ChatIcon role="user" />}
              </ChatMessage>
            ))}

            {isLoading && (
              <ChatMessage className="justify-start">
                <ChatIcon role="assistant" />
                <ChatText role="assistant">
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <span className="size-2 animate-pulse rounded-full bg-slate-400" />
                    Thinking...
                  </span>
                </ChatText>
              </ChatMessage>
            )}

            <div ref={endOfMessagesRef} />
          </Chat>

          <form onSubmit={handleSubmit} className="border-t border-slate-200/80 bg-white/90 p-4 sm:p-5">
            <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100">
              <textarea
                className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || isComplete}
                placeholder={isComplete ? 'Survey complete' : 'Type your answer...'}
                rows={1}
              />
              <button
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                type="submit"
                disabled={!draft.trim() || isLoading || isComplete}
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">Press Enter to send. Use Shift + Enter for a new line.</p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default App;