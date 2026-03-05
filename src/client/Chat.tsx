import type { ComponentPropsWithoutRef } from "react";

interface ChatProps extends ComponentPropsWithoutRef<"div"> {

}

export function Chat(props: ChatProps) {
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