import { get, post } from "@/lib/api"
import type {
  CreateMapChatRoomRequest,
  MapChatMessage,
  MapChatMessageList,
  MapChatRoom,
  MapChatRoomListItem,
  SendMapChatMessageRequest,
} from "@/lib/mapchat/mapchat-types"

import type { MapChatReadEvent } from "@/lib/mapchat/mapchat-types";
/**
 * 매물 문의 채팅방 생성 또는 기존방 조회
 */

export function createOrGetMapChatRoom(propertyId: number) {
  const body: CreateMapChatRoomRequest = {
    propertyId,
  }

  return post<MapChatRoom, CreateMapChatRoomRequest>("/api/map/chat/rooms", body)
}

/**
 * 내 전체 채팅방 목록 조회
 */
export function getMyMapChatRooms() {
  return get<MapChatRoomListItem[]>("/api/map/chat/rooms/my")
}

/**
 * 특정 매물에 들어온 문의 채팅방 목록 조회
 */
export function getPropertyMapChatRooms(propertyId: number) {
  return get<MapChatRoomListItem[]>(
    `/api/map/chat/properties/${propertyId}/rooms`
  )
}

/**
 * 채팅방 메시지 목록 조회 + 읽음 처리
 */
export function getMapChatMessages(chatRoomId: number) {
  return get<MapChatMessageList>(
    `/api/map/chat/rooms/${chatRoomId}/messages`
  )
}

/**
 * 메시지 전송
 */
export function sendMapChatMessage(
  chatRoomId: number,
  messageContent: string
) {
  const body: SendMapChatMessageRequest = {
    messageContent,
  }

  return post<MapChatMessage, SendMapChatMessageRequest>(
    `/api/map/chat/rooms/${chatRoomId}/messages`,
    body
  )
}

export async function markMapChatRoomAsRead(chatRoomId: number) {
  return post<MapChatReadEvent>(`/api/map/chat/rooms/${chatRoomId}/read`);
}