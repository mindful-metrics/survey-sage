type ChatIconProps = {
  role: "user" | "assistant"
}

export function ChatIcon({ role }: ChatIconProps) {
  const label = role === "assistant" ? "S" : "You"
  const className = role === "assistant"
    ? "bg-sky-100 text-sky-700 ring-sky-200"
    : "bg-slate-200 text-slate-700 ring-slate-300"

  return (
    <div className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ${className}`}>
      {label}
    </div>
  )
}