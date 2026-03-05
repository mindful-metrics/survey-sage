import { Chat } from "./Chat";
import { ChatIcon } from "./ChatIcon";
import { ChatMessage } from "./ChatMessage";
import { ChatText } from "./ChatText";
import "./index.css";

export function App() {
  return (
    <div className="min-h-screen">
      <div id="chat-interface-background" className="max-w-7xl mx-auto h-100 p-8 m-8 rounded-xl text-center relative z-10">
        <div className="size-full mx-auto rounded-xl bg-white/75">
          <h1 className="text-5xl font-bold my-4 leading-tight">Good Morning!</h1>
          <div className="lg:p-32">
            <Chat className="flex-row gap-2">
              <ChatMessage className="w-full flex-row gap-2 inline-flex items-center">
                <ChatIcon />
                <ChatText role="assistant" className="bg-white max-w-sm rounded-t-xl rounded-br-xl p-1">
                  How are you this morning?
                </ChatText>
              </ChatMessage>
              <ChatMessage className="w-full flex-row-reverse gap-2 inline-flex items-center">
                <ChatIcon />
                <ChatText role="user" className="bg-white max-w-sm rounded-t-xl rounded-bl-xl p-1">
                  I'm doing good
                </ChatText>
              </ChatMessage>
              <div className="w-full min-h-6 bg-white rounded-xl p-2 mt-4">
                <input className="w-full"></input>
              </div>
            </Chat>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
