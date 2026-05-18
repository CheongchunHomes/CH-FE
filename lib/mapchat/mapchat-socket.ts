import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
  MapChatMessage,
  MapChatReadEvent,
  MapChatRoomEvent,
} from "@/lib/mapchat/mapchat-types";

type SubscribeMapChatRoomParams = {
  chatRoomId: number;
  userId: number;
  onMessage: (message: MapChatMessage) => void;
  onError?: (message: string) => void;
};

type SubscribeMapChatReadParams = {
  chatRoomId: number;
  userId: number;
  onRead: (event: MapChatReadEvent) => void;
  onError?: (message: string) => void;
};

type SubscribeMapChatRoomEventsParams = {
  userId: number;
  onRoomEvent: (event: MapChatRoomEvent) => void;
  onError?: (message: string) => void;
};

const DEFAULT_WS_URL = "http://localhost:18080/ws/map-chat";

function getMapChatWsUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim() || DEFAULT_WS_URL;
}


/**
 * 내 채팅방 목록과 전체 안 읽은 숫자 이벤트를 구독합니다.
 */
export function subscribeMapChatRoomEvents({
  userId,
  onRoomEvent,
  onError,
}: SubscribeMapChatRoomEventsParams) {
  let subscription: StompSubscription | null = null;

  const client = new Client({
    webSocketFactory: () => new SockJS(getMapChatWsUrl()),
    reconnectDelay: 3000,
    debug:
      process.env.NODE_ENV === "development"
        ? (message) => console.log("[mapchat-room-event-socket]", message)
        : () => {},
    onConnect: () => {
      const topic = `/sub/map/chat/users/${userId}/rooms`;

      subscription = client.subscribe(topic, (frame: IMessage) => {
        try {
          const roomEvent = JSON.parse(frame.body) as MapChatRoomEvent;
          onRoomEvent(roomEvent);
        } catch (error) {
          console.error(error);
          onError?.("채팅방 목록 이벤트 처리 중 문제가 발생했습니다.");
        }
      });
    },
    onStompError: () => {
      onError?.("채팅방 목록 이벤트 서버 연결 중 문제가 발생했습니다.");
    },
    onWebSocketError: () => {
      onError?.("채팅방 목록 이벤트 연결에 실패했습니다.");
    },
  });

  client.activate();

  return () => {
    subscription?.unsubscribe();
    void client.deactivate();
  };
}
type SubscribeMapChatPanelParams = {
  chatRoomId: number;
  userId: number;
  onMessage: (message: MapChatMessage) => void;
  onRead: (event: MapChatReadEvent) => void;
  onError?: (message: string) => void;
};

/**
 * 채팅창에서 필요한 메시지 이벤트와 읽음 이벤트를 하나의 WebSocket 연결로 구독합니다.
 */
export function subscribeMapChatPanel({
  chatRoomId,
  userId,
  onMessage,
  onRead,
  onError,
}: SubscribeMapChatPanelParams) {
  const subscriptions: StompSubscription[] = [];

  const client = new Client({
    webSocketFactory: () => new SockJS(getMapChatWsUrl()),
    reconnectDelay: 3000,
    debug:
      process.env.NODE_ENV === "development"
        ? (message) => console.log("[mapchat-panel-socket]", message)
        : () => {},

    onConnect: () => {
      const messageTopic = `/sub/map/chat/rooms/${chatRoomId}/users/${userId}`;
      const readTopic = `/sub/map/chat/rooms/${chatRoomId}/users/${userId}/read`;

      subscriptions.push(
        client.subscribe(messageTopic, (frame: IMessage) => {
          try {
            const message = JSON.parse(frame.body) as MapChatMessage;
            onMessage(message);
          } catch (error) {
            console.error(error);
            onError?.("실시간 메시지 처리 중 문제가 발생했습니다.");
          }
        })
      );

      subscriptions.push(
        client.subscribe(readTopic, (frame: IMessage) => {
          try {
            const readEvent = JSON.parse(frame.body) as MapChatReadEvent;
            console.log("[READ EVENT RECEIVED]", readEvent);
            onRead(readEvent);
          } catch (error) {
            console.error(error);
            onError?.("읽음 이벤트 처리 중 문제가 발생했습니다.");
          }
        })
      );
    },

    onStompError: () => {
      onError?.("실시간 채팅 서버 연결 중 문제가 발생했습니다.");
    },

    onWebSocketError: () => {
      onError?.("실시간 채팅 연결에 실패했습니다.");
    },
  });

  client.activate();

  return () => {
    for (const subscription of subscriptions) {
      subscription.unsubscribe();
    }

    void client.deactivate();
  };
}