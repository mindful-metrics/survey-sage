import type { ComponentPropsWithoutRef } from "react";

interface ChatMessageProps extends ComponentPropsWithoutRef<"div"> {

}

export function ChatMessage(props: ChatMessageProps) {
    const {
        children,
        ...rest
    } = props;

    return (
        <div {...rest}>
            {children}
        </div>
    )
}