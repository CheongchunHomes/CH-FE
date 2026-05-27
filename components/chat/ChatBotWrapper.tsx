"use client";

import { usePathname } from "next/navigation";
import MiniChatWidget from "./MiniChatWidget";

export default function ChatBotWrapper() {
    const pathname = usePathname();

    const hideChatBot = 
        pathname === "/site/map";
    
    if (hideChatBot) return null;

    return <MiniChatWidget />
}