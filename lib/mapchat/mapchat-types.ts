export type MapChatMessageType = "TEXT" | "APPOINTMENT_REQUEST" | "SYSTEM"

export type MapChatRoomRole = "TENANT" | "LANDLORD" | "UNKNOWN"

export type MapChatRoom = {
  chatRoomId: number
  propertyId: number
  tenantUserId: number
  landlordUserId: number
  lastMessageContent: string | null
  lastMessageAt: string | null
  lastSenderId: number | null
  createdAt: string
}

export type MapChatRoomListItem = {
  chatRoomId: number
  propertyId: number
  tenantUserId: number
  landlordUserId: number
  lastMessageContent: string | null
  lastMessageAt: string | null
  lastSenderId: number | null
  unreadCount: number
  myRoleInRoom: MapChatRoomRole
  createdAt: string
}

export type MapChatMessage = {
  messageId: number
  chatRoomId: number
  senderId: number
  receiverId: number
  messageContent: string
  messageType: MapChatMessageType
  read: boolean
  mine: boolean
  createdAt: string
}

export type MapChatMessageList = {
  chatRoomId: number
  messages: MapChatMessage[]
}

export type CreateMapChatRoomRequest = {
  propertyId: number
}

export type SendMapChatMessageRequest = {
  messageContent: string
}

export type MapChatReadEvent = {
  chatRoomId: number;
  readerId: number;
  readMessageIds: number[];
  readAt: string;
};

export type MapChatRoomEvent = {
  room: MapChatRoomListItem;
  totalUnreadCount: number;
};