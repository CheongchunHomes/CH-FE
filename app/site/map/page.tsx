"use client";

import {useCallback, useEffect, useMemo, useState } from "react";
import KakaoMap from "@/components/map/kakaoMap";
import MapFilterBar from "@/components/map/mapFilterBar";
import MapSidebar from "@/components/map/mapSiderbar";
import MapPropertyDetailPanel from "@/components/map/map-utils/mapPropertyDetailPanel";
import MapChatPanel from "@/components/mapChat/MapChatPanel";
import MapChatRoomListPanel from "@/components/mapChat/MapChatRoomListPanel";
import MapMyChatRoomPanel from "@/components/mapChat/MapMyChatRoomPanel";
import {
  DEFAULT_MAP_FILTERS,
  filterMapListings,
  normalizeMapListings,
} from "@/lib/map/map-filter";
import type {
  MapFilterCategory,
  MapFilterState,
  MapListing,
} from "@/lib/map/map-types";
import { get, ApiError } from "@/lib/api";
import {
  createOrGetMapChatRoom,
  getMyMapChatRooms,
  getPropertyMapChatRooms,
} from "@/lib/mapchat/mapchat-api";
import type { MapChatRoomListItem } from "@/lib/mapchat/mapchat-types";

import { subscribeMapChatRoomEvents } from "@/lib/mapchat/mapchat-socket";

type CurrentUserResponse = {
  id: number;
  email: string;
  nickname: string;
  role: string;
};

export default function MapPage() {
  const [listings, setListings] = useState<MapListing[]>([]);
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_MAP_FILTERS);

  const [selectedListings, setSelectedListings] = useState<MapListing[] | null>(
    null
  );
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedChatRoomId, setSelectedChatRoomId] = useState<number | null>(
    null
  );
  const [chatPanelTitle, setChatPanelTitle] = useState("");
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [chatErrorMessage, setChatErrorMessage] = useState("");

  const [propertyChatRooms, setPropertyChatRooms] = useState<
    MapChatRoomListItem[]
  >([]);
  const [isRoomListOpen, setIsRoomListOpen] = useState(false);

  const [myChatRooms, setMyChatRooms] = useState<MapChatRoomListItem[]>([]);
  const [isMyChatOpen, setIsMyChatOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [returnToMyChatList, setReturnToMyChatList] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  // 현재 로그인 사용자 정보를 조회합니다.
    useEffect(() => {
      let ignore = false;

      const fetchCurrentUser = async () => {
        try {
          const user = await get<CurrentUserResponse>("/api/auth/me");

          if (!ignore) {
            setCurrentUserId(user.id);
          }
        } catch {
          if (!ignore) {
            setCurrentUserId(null);
          }
        }
      };

      fetchCurrentUser();

      return () => {
        ignore = true;
      };
    }, []);
    // 채팅방 이벤트를 화면 상태에 반영합니다.
      const applyRoomEvent = useCallback((event: {
          room: MapChatRoomListItem;
          totalUnreadCount: number;
        }) => {
          setChatUnreadCount(event.totalUnreadCount);

          setMyChatRooms((prevRooms) =>
            upsertAndSortChatRooms(prevRooms, event.room)
          );

          setPropertyChatRooms((prevRooms) =>
            upsertAndSortChatRooms(prevRooms, event.room)
          );
        }, []);
        // 내 채팅방 목록/사이드바 숫자를 WebSocket으로 실시간 갱신합니다.
          useEffect(() => {
            if (!currentUserId) {
              return;
            }

            const unsubscribe = subscribeMapChatRoomEvents({
              userId: currentUserId,
              onRoomEvent: applyRoomEvent,
              onError: setChatErrorMessage,
            });

            return unsubscribe;
          }, [currentUserId, applyRoomEvent]);

        // 지도 매물 목록을 불러옵니다.
        useEffect(() => {
          const fetchMapListings = async () => {
            try {
              setIsLoading(true);
              setErrorMessage("");

              const data = await get<MapListing[]>("/api/properties/map");

              setListings(normalizeMapListings(data));
            } catch (error) {
              if (error instanceof ApiError) {
                setErrorMessage(error.message || "매물 목록을 불러오지 못했습니다.");
                return;
              }

              setErrorMessage("매물 목록을 불러오는 중 문제가 발생했습니다.");
            } finally {
              setIsLoading(false);
            }
          };

          fetchMapListings();
        }, []);

  // 지도 진입 시 채팅 안 읽은 숫자를 조회합니다.
  useEffect(() => {
    refreshChatUnreadCount();
  }, []);

  // 현재 필터에 맞는 매물 목록을 계산합니다.
  const filteredListings = useMemo(() => {
    return filterMapListings(listings, filters);
  }, [listings, filters]);

  // 사이드바에 표시할 목록을 결정합니다.
  const sidebarListings = selectedListings ?? filteredListings;

  // 안 읽은 채팅 메시지 총합을 조회합니다.
  const refreshChatUnreadCount = async () => {
    try {
      const rooms = await getMyMapChatRooms();

      const totalUnreadCount = rooms.reduce((sum, room) => {
        return sum + room.unreadCount;
      }, 0);

      setChatUnreadCount(totalUnreadCount);
    } catch {
      setChatUnreadCount(0);
    }
  };

  // 내 채팅방 목록을 다시 불러옵니다.
  const refreshMyChatRooms = async () => {
    try {
      const rooms = await getMyMapChatRooms();

      setMyChatRooms(rooms);

      const totalUnreadCount = rooms.reduce((sum, room) => {
        return sum + room.unreadCount;
      }, 0);

      setChatUnreadCount(totalUnreadCount);
    } catch {
      setMyChatRooms([]);
      setChatUnreadCount(0);
    }
  };

  // 필터 전체를 변경합니다.
  const handleChangeFilters = (nextFilters: MapFilterState) => {
    setFilters(nextFilters);
    setSelectedListings(null);
    setSelectedListing(null);
  };

  // 카테고리 필터를 변경합니다.
  const handleChangeCategory = (category: MapFilterCategory) => {
    setFilters((prev) => ({
      ...prev,
      category,
    }));

    setSelectedListings(null);
    setSelectedListing(null);
  };

  // 필터를 초기화합니다.
  const handleResetFilters = () => {
    setFilters(DEFAULT_MAP_FILTERS);
    setSelectedListings(null);
    setSelectedListing(null);
  };

  // 단일 마커 클릭 시 해당 매물 상세 패널을 엽니다.
  const handleSingleMarkerClick = (listing: MapListing) => {
    setSelectedListings([listing]);
    setSelectedListing(listing);
  };

  // 클러스터 클릭 시 매물 목록을 사이드바에 표시합니다.
  const handleClusterClick = (clusterListings: MapListing[]) => {
    setSelectedListings(clusterListings);
    setSelectedListing(null);
  };

  // 사이드바 매물 카드 클릭 시 상세 패널을 엽니다.
  const handleSelectListing = (listing: MapListing) => {
    setSelectedListing(listing);
  };

  // 클러스터 선택 목록을 해제합니다.
  const handleClearSelection = () => {
    setSelectedListings(null);
    setSelectedListing(null);
  };

 // 채팅 메뉴 클릭 시 전체 채팅방 목록을 엽니다.
  const handleOpenChatList = async () => {
    try {
      setChatErrorMessage("");

      // 다른 채팅 UI를 닫고 전체 채팅 목록을 엽니다.
      setSelectedChatRoomId(null);
      setIsRoomListOpen(false);
      setPropertyChatRooms([]);
      setReturnToMyChatList(false);

      const rooms = await getMyMapChatRooms();

      setMyChatRooms(rooms);
      setIsMyChatOpen(true);

      const totalUnreadCount = rooms.reduce((sum, room) => {
        return sum + room.unreadCount;
      }, 0);

      setChatUnreadCount(totalUnreadCount);
    } catch {
      setChatErrorMessage("채팅 목록을 불러오는 중 문제가 발생했습니다.");
    }
  };

  // 채팅하기 클릭 시 채팅방 또는 매물 채팅 목록을 엽니다.
  const handleOpenChat = async (listing: MapListing) => {
    try {
      setIsOpeningChat(true);
      setChatErrorMessage("");

      // 기존 채팅 UI를 초기화합니다.
      setSelectedChatRoomId(null);
      setIsRoomListOpen(false);
      setIsMyChatOpen(false);
      setPropertyChatRooms([]);
      setReturnToMyChatList(false);

      // 임차인은 해당 매물 채팅방을 생성하거나 기존 방을 받습니다.
      const room = await createOrGetMapChatRoom(listing.id);

      setSelectedChatRoomId(room.chatRoomId);
      setChatPanelTitle(listing.title);
    } catch {
      try {
        // 임대인은 해당 매물에 들어온 채팅 목록을 조회합니다.
        const rooms = await getPropertyMapChatRooms(listing.id);

        setPropertyChatRooms(rooms);
        setIsRoomListOpen(true);
        setIsMyChatOpen(false);
        setChatPanelTitle(`${listing.title} 채팅 목록`);
      } catch {
        setChatErrorMessage(
          "채팅을 열 수 없습니다. 로그인 상태 또는 매물 권한을 확인해주세요."
        );
      }
    } finally {
      setIsOpeningChat(false);
    }
  };

  // 선택한 채팅방을 채팅창으로 엽니다.
  const handleSelectChatRoom = (room: MapChatRoomListItem) => {
    setSelectedChatRoomId(room.chatRoomId);
    setChatPanelTitle(getChatRoomTitle(room));

    // 전체 채팅 목록에서 들어온 경우 닫을 때 다시 목록으로 돌아갑니다.
    setReturnToMyChatList(isMyChatOpen);

    setIsRoomListOpen(false);
    setIsMyChatOpen(false);
  };

  return (
    <main className="flex h-full min-h-0 flex-col bg-white">
      {/* 지도 상단 필터바입니다. */}
      <MapFilterBar
        filters={filters}
        onChangeFilters={handleChangeFilters}
        onResetFilters={handleResetFilters}
      />

      <div className="flex min-h-0 flex-1">
        {/* 왼쪽 매물 목록과 채팅 메뉴입니다. */}
        <MapSidebar
          listings={sidebarListings}
          activeCategory={filters.category}
          isSelectionMode={selectedListings !== null}
          onChangeCategory={handleChangeCategory}
          onClearSelection={handleClearSelection}
          onSelectListing={handleSelectListing}
          chatUnreadCount={chatUnreadCount}
          onOpenChatList={handleOpenChatList}
        />

        {/* 가운데 매물 상세 패널입니다. */}
        <MapPropertyDetailPanel
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onOpenChat={handleOpenChat}
          isOpeningChat={isOpeningChat}
        />

        {/* 오른쪽 지도 영역입니다. */}
        <section className="relative min-w-0 flex-1">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 text-sm font-semibold text-slate-600">
              매물 정보를 불러오는 중입니다.
            </div>
          )}

          {errorMessage && (
            <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm">
              {errorMessage}
            </div>
          )}

          <KakaoMap
            listings={filteredListings}
            onSingleMarkerClick={handleSingleMarkerClick}
            onClusterClick={handleClusterClick}
          />

          {chatErrorMessage && (
            <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm">
              {chatErrorMessage}
            </div>
          )}

          {isMyChatOpen && (
            <MapMyChatRoomPanel
              rooms={myChatRooms}
              onSelectRoom={handleSelectChatRoom}
              onClose={() => setIsMyChatOpen(false)}
            />
          )}

          {isRoomListOpen && (
            <MapChatRoomListPanel
              title={chatPanelTitle}
              rooms={propertyChatRooms}
              onSelectRoom={handleSelectChatRoom}
              onClose={() => setIsRoomListOpen(false)}
            />
          )}

          {selectedChatRoomId && (
            <MapChatPanel
              chatRoomId={selectedChatRoomId}
              title={chatPanelTitle}
              onClose={async () => {
                setSelectedChatRoomId(null);

                // 채팅창을 닫으면 안 읽은 숫자를 다시 계산합니다.
                await refreshChatUnreadCount();

                // 내 채팅 목록에서 들어온 경우 목록으로 돌아갑니다.
                if (returnToMyChatList) {
                  await refreshMyChatRooms();
                  setIsMyChatOpen(true);
                  setReturnToMyChatList(false);
                }
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}

// 채팅방 제목을 현재 사용자 역할 기준으로 만듭니다.
function getChatRoomTitle(room: MapChatRoomListItem) {
  if (room.myRoleInRoom === "LANDLORD") {
    return `문의자 #${room.tenantUserId}`;
  }

  if (room.myRoleInRoom === "TENANT") {
    return `임대인 #${room.landlordUserId}`;
  }

  return `채팅방 #${room.chatRoomId}`;
}

// 채팅방 목록에 새 이벤트를 반영하고 최신순으로 정렬합니다.
function upsertAndSortChatRooms(
  rooms: MapChatRoomListItem[],
  incomingRoom: MapChatRoomListItem
) {
  const roomMap = new Map<number, MapChatRoomListItem>();

  for (const room of rooms) {
    roomMap.set(room.chatRoomId, room);
  }

  roomMap.set(incomingRoom.chatRoomId, incomingRoom);

  return Array.from(roomMap.values()).sort((a, b) => {
    const timeA = getRoomSortTime(a);
    const timeB = getRoomSortTime(b);

    return timeB - timeA;
  });
}

// 채팅방 정렬 기준 시간을 계산합니다.
function getRoomSortTime(room: MapChatRoomListItem) {
  const value = room.lastMessageAt || room.createdAt;
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}