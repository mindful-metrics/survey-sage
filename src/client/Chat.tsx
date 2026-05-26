import type { ComponentPropsWithoutRef } from "react";

interface ChatProps extends ComponentPropsWithoutRef<"div"> {}

export function Chat(props: ChatProps) {
  const { children, className = "", ...rest } = props;

  return (
    <div className={className} {...rest}>
      {children}
    </div>
  )
}