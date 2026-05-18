"use client";

import type { MapChatRoomListItem } from "@/lib/mapchat/mapchat-types";

type MapMyChatRoomPanelProps = {
  rooms: MapChatRoomListItem[];
  onSelectRoom: (room: MapChatRoomListItem) => void;
  onClose: () => void;
};

export default function MapMyChatRoomPanel({
  rooms,
  onSelectRoom,
  onClose,
}: MapMyChatRoomPanelProps) {
  return (
    <div className="absolute bottom-5 right-5 z-40 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* 내 채팅 목록 상단입니다. */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-blue-300">청춘홈즈 채팅</p>

          <h3 className="mt-1 text-sm font-bold text-white">
            내 채팅 목록
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

      {/* 내가 참여한 채팅방 목록입니다. */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
        {rooms.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-slate-500">
            아직 참여 중인 채팅방이 없습니다.
            <br />
            관심 있는 매물에서 문의를 시작해보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <button
                key={room.chatRoomId}
                type="button"
                onClick={() => onSelectRoom(room)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {getRoomTitle(room)}
                      </p>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {getRoleLabel(room.myRoleInRoom)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {room.lastMessageContent || "아직 메시지가 없습니다."}
                    </p>
                  </div>

                  {room.unreadCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                      {room.unreadCount}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>매물 #{room.propertyId}</span>
                  <span>{formatRoomTime(room.lastMessageAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 내 역할에 따라 채팅방 제목을 만듭니다.
function getRoomTitle(room: MapChatRoomListItem) {
  if (room.myRoleInRoom === "LANDLORD") {
    return `문의자 #${room.tenantUserId}`;
  }

  if (room.myRoleInRoom === "TENANT") {
    return `임대인 #${room.landlordUserId}`;
  }

  return `채팅방 #${room.chatRoomId}`;
}

// 역할 코드를 화면용 문구로 바꿉니다.
function getRoleLabel(role: MapChatRoomListItem["myRoleInRoom"]) {
  if (role === "LANDLORD") {
    return "임대인";
  }

  if (role === "TENANT") {
    return "임차인";
  }

  return "참여자";
}

// 채팅방 시간을 화면용으로 변환합니다.
function formatRoomTime(value?: string | null) {
  if (!value) {
    return "";
  }

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