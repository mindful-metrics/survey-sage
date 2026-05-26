import type { ComponentPropsWithoutRef } from "react";

interface ChatMessageProps extends ComponentPropsWithoutRef<"div"> {}

export function ChatMessage(props: ChatMessageProps) {
  const { children, className = "", ...rest } = props;

  return (
    <div className={`flex w-full items-end gap-3 ${className}`} {...rest}>
      {children}
    </div>
  )
}