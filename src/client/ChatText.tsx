import type { ComponentPropsWithoutRef } from "react";

interface ChatTextProps extends ComponentPropsWithoutRef<"div"> {
    role: string
}

export function ChatText(props: ChatTextProps) {
    const {
        role,
        children,
        ...rest
    } = props;
    return (
        <div {...rest}>
            {children}
        </div>
    )
}