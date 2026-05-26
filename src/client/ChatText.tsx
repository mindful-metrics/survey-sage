import type { ComponentPropsWithoutRef } from "react";

interface ChatTextProps extends ComponentPropsWithoutRef<"div"> {
  role: string
}

export function ChatText(props: ChatTextProps) {
  const { role, children, className = "", ...rest } = props;
  const bubbleClass = role === "assistant"
    ? "rounded-t-2xl rounded-br-2xl bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/70"
    : "rounded-t-2xl rounded-bl-2xl bg-slate-950 text-white shadow-sm"

  return (
    <div className={`max-w-[78%] px-4 py-3 sm:max-w-2xl text-left text-sm leading-6 sm:text-base ${bubbleClass} ${className}`} {...rest}>
      {children}
    </div>
  )
}