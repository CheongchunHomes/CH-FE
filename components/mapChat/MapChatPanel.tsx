"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ApiError, get } from "@/lib/api";
import {
  getMapChatMessages,
  markMapChatRoomAsRead,
  sendMapChatMessage,
} from "@/lib/mapchat/mapchat-api";
import { subscribeMapChatPanel } from "@/lib/mapchat/mapchat-socket";
import type {
  MapChatMessage,
  MapChatReadEvent,
} from "@/lib/mapchat/mapchat-types";

type MapChatPanelProps = {
  chatRoomId: number;
  title?: string;
  onClose: () => void;
};

type CurrentUserResponse = {
  id: number;
  email: string;
  nickname: string;
  role: string;
};

export default function MapChatPanel({
  chatRoomId,
  title = "매물 문의 채팅",
  onClose,
}: MapChatPanelProps) {
  const [messages, setMessages] = useState<MapChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * 메시지를 중복 없이 추가합니다.
   */
  const appendMessage = useCallback((newMessage: MapChatMessage) => {
    setMessages((prevMessages) =>
      sortMessagesByCreatedAt(mergeMessages(prevMessages, [newMessage]))
    );
  }, []);

  /**
   * 읽음 이벤트를 화면에 반영합니다.
   */
  const applyReadEvent = useCallback((readEvent: MapChatReadEvent) => {
    if (readEvent.readMessageIds.length === 0) {
      return;
    }

    const readIdSet = new Set(readEvent.readMessageIds);

    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        readIdSet.has(message.messageId)
          ? { ...message, read: true }
          : message
      )
    );
  }, []);

  /**
   * 현재 채팅방의 받은 메시지를 읽음 처리합니다.
   */
  const markCurrentRoomAsRead = useCallback(async () => {
    try {
      const readEvent = await markMapChatRoomAsRead(chatRoomId);
      applyReadEvent(readEvent);
    } catch (error) {
      console.error(error);
    }
  }, [chatRoomId, applyReadEvent]);

  /**
   * 채팅방 메시지를 불러옵니다.
   */
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

     const data = await getMapChatMessages(chatRoomId);

      setMessages((prevMessages) =>
        sortMessagesByCreatedAt(mergeMessages(prevMessages, data.messages))
      );
    } catch (error) {
      console.error(error);

      if (error instanceof ApiError) {
        setErrorMessage(error.message || "메시지를 불러오지 못했습니다.");
        return;
      }

      setErrorMessage("메시지를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [chatRoomId]);

  /**
   * 현재 로그인 사용자 정보를 조회합니다.
   */
  useEffect(() => {
    let ignore = false;

    const fetchCurrentUser = async () => {
      try {
        const user = await get<CurrentUserResponse>("/api/auth/me");

        if (!ignore) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setErrorMessage("로그인 사용자 정보를 불러오지 못했습니다.");
        }
      }
    };

    fetchCurrentUser();

    return () => {
      ignore = true;
    };
  }, []);

  /**
   * 채팅방이 바뀌면 메시지를 다시 조회합니다.
   */
  useEffect(() => {
    setMessages([]);
    fetchMessages();
  }, [chatRoomId, fetchMessages]);

  /**
   * 채팅방이 열려 있으면 받은 메시지를 읽음 처리합니다.
   */
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    markCurrentRoomAsRead();
  }, [currentUserId, markCurrentRoomAsRead]);

/**
 * WebSocket 하나로 메시지 이벤트와 읽음 이벤트를 함께 수신합니다.
 */
useEffect(() => {
  if (!currentUserId) {
    return;
  }

  const unsubscribe = subscribeMapChatPanel({
    chatRoomId,
    userId: currentUserId,
    onMessage: (message: MapChatMessage) => {
      appendMessage(message);

      if (!message.mine) {
        markCurrentRoomAsRead();
      }
    },
    onRead: (readEvent: MapChatReadEvent) => {
      console.log("[READ EVENT RECEIVED IN PANEL]", readEvent);
      applyReadEvent(readEvent);
    },
    onError: setErrorMessage,
  });

  return unsubscribe;
}, [
  chatRoomId,
  currentUserId,
  appendMessage,
  markCurrentRoomAsRead,
  applyReadEvent,
]);
  
  /**
   * 메시지 목록이 바뀌면 가장 아래로 이동합니다.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * 메시지를 전송합니다.
   */
  const handleSendMessage = async () => {
    const trimmedContent = messageContent.trim();

    if (!trimmedContent) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage("");

      const sentMessage = await sendMapChatMessage(chatRoomId, trimmedContent);

      appendMessage(sentMessage);
      setMessageContent("");
    } catch (error) {
      console.error(error);

      if (error instanceof ApiError) {
        setErrorMessage(error.message || "메시지 전송에 실패했습니다.");
        return;
      }

      setErrorMessage("메시지를 전송하는 중 문제가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Enter는 전송, Shift + Enter는 줄바꿈입니다.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="absolute bottom-5 right-5 z-40 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* 채팅창 상단 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-blue-300">청춘홈즈 문의</p>
          <h3 className="mt-1 max-w-[260px] truncate text-sm font-bold text-white">
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-lg font-bold text-white hover:bg-white/10"
        >
          ×
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
            메시지를 불러오는 중입니다.
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-slate-500">
            아직 메시지가 없습니다.
            <br />
            첫 문의 메시지를 보내보세요.
          </div>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="space-y-3">
            {messages.map((message) => (
              <ChatBubble key={message.messageId} message={message} />
            ))}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
          {errorMessage}
        </div>
      )}

      {/* 메시지 입력 영역 */}
      <div className="border-t border-slate-200 bg-white p-3">
        <textarea
          value={messageContent}
          onChange={(event) => setMessageContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요."
          className="h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={isSending || messageContent.trim().length === 0}
          className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSending ? "전송 중..." : "메시지 보내기"}
        </button>
      </div>
    </div>
  );
}

type ChatBubbleProps = {
  message: MapChatMessage;
};

function ChatBubble({ message }: ChatBubbleProps) {
  const isMine = message.mine;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[78%] flex-col ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        {!isMine && (
          <span className="mb-1 text-[11px] font-semibold text-slate-400">
            상대방
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isMine
              ? "rounded-br-md bg-blue-600 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.messageContent}
          </p>
        </div>

        <div
          className={`mt-1 flex items-center gap-2 text-[11px] ${
            isMine
              ? "justify-end text-slate-400"
              : "justify-start text-slate-400"
          }`}
        >
          {isMine && (
            <span className="font-semibold">
              {message.read ? "읽음" : "안 읽음"}
            </span>
          )}

          <span>{formatChatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
function mergeMessages(
  baseMessages: MapChatMessage[],
  incomingMessages: MapChatMessage[]
) {
  const messageMap = new Map<number, MapChatMessage>();

  for (const message of baseMessages) {
    messageMap.set(message.messageId, message);
  }

  for (const incomingMessage of incomingMessages) {
    const existingMessage = messageMap.get(incomingMessage.messageId);

    if (!existingMessage) {
      messageMap.set(incomingMessage.messageId, incomingMessage);
      continue;
    }

    messageMap.set(incomingMessage.messageId, {
      ...existingMessage,
      ...incomingMessage,

      // 한 번 읽음 처리된 메시지는 나중에 read:false가 다시 와도 되돌리지 않습니다.
      read: existingMessage.read || incomingMessage.read,

      // 내 메시지 여부는 현재 화면 기준 값이 더 중요하므로 기존 값을 우선 유지합니다.
      mine: existingMessage.mine,
    });
  }

  return Array.from(messageMap.values());
}

function sortMessagesByCreatedAt(messages: MapChatMessage[]) {
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return a.messageId - b.messageId;
  });
}

function formatChatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}