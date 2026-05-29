"use client";

import { usePathname } from "next/navigation";
import MiniChatWidget from "./MiniChatWidget";

export default function ChatBotWrapper() {
    const pathname = usePathname();

    const hideChatBotPaths = [
        "/site/map",
        "/live2d",
    ]
       
    const hideChatBot = hideChatBotPaths.includes(pathname);
    
    if (hideChatBot) return null;

    return <MiniChatWidget />
}