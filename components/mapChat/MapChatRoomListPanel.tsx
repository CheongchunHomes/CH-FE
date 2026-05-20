"use client";

import type { MapChatRoomListItem } from "@/lib/mapchat/mapchat-types";

type MapChatRoomListPanelProps = {
  title?: string;
  rooms: MapChatRoomListItem[];
  onSelectRoom: (room: MapChatRoomListItem) => void;
  onClose: () => void;
};

export default function MapChatRoomListPanel({
  title = "매물 문의 목록",
  rooms,
  onSelectRoom,
  onClose,
}: MapChatRoomListPanelProps) {
  return (
    <div className="absolute bottom-5 right-5 z-40 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* 문의 목록 상단입니다. */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-blue-300">
            청춘홈즈 문의 관리
          </p>

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

      {/* 문의방 목록입니다. */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
        {rooms.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm leading-6 text-slate-500">
            아직 이 매물에 들어온 문의가 없습니다.
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
                    <p className="truncate text-sm font-bold text-slate-900">
                      문의자 #{room.tenantUserId}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
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
                  <span>{room.myRoleInRoom}</span>
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