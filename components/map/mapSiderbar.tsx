"use client";

import type { MapFilterCategory, MapListing } from "@/lib/map/map-types";
import MapListingCard from "./mapListngCard";
import MapSiderCategoryMenu from "./mapSiderCategoryMenu";

type MapSidebarProps = {
  listings: MapListing[];
  activeCategory: MapFilterCategory;
  isSelectionMode: boolean;
  onChangeCategory: (category: MapFilterCategory) => void;
  onClearSelection: () => void;
  onSelectListing?: (listing: MapListing) => void;
  chatUnreadCount?: number;
  onOpenChatList?: () => void;
};

export default function MapSidebar({
  listings,
  activeCategory,
  isSelectionMode,
  onChangeCategory,
  onClearSelection,
  onSelectListing,
  chatUnreadCount = 0,
  onOpenChatList,
}: MapSidebarProps) {
  return (
    <aside className="h-full w-[380px] shrink-0 border-r border-slate-200 bg-white">
      {/* 지도 사이드바 제목 영역입니다. */}
      <div className="border-b border-slate-200 p-4">
        <h1 className="text-lg font-bold text-slate-900">집·공고 확인</h1>
        <p className="mt-1 text-sm text-slate-500">
          청년 주거 공고와 매물을 지도에서 확인하세요.
        </p>
      </div>

      <div className="flex h-[calc(100%-73px)]">
        {/* 왼쪽 카테고리 메뉴입니다. */}
        <MapSiderCategoryMenu
          activeCategory={activeCategory}
          onChangeCategory={onChangeCategory}
          chatUnreadCount={chatUnreadCount}
          onOpenChatList={onOpenChatList}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {/* 현재 목록 기준과 개수를 보여줍니다. */}
          <div className="mb-3 rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white">
            {isSelectionMode
              ? `선택한 매물 ${listings.length}개`
              : `${getCategoryTitle(activeCategory)} ${listings.length}개`}
          </div>

          {/* 마커 선택 모드에서 전체 목록으로 돌아갑니다. */}
          {isSelectionMode && (
            <button
              type="button"
              onClick={onClearSelection}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              전체 목록으로 돌아가기
            </button>
          )}

          {/* 필터링된 매물 카드를 출력합니다. */}
          <div className="space-y-4">
            {listings.length > 0 ? (
              listings.map((item) => (
                <MapListingCard
                  key={item.id}
                  item={item}
                  onClick={onSelectListing}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                표시할 매물이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// 현재 카테고리명을 화면용 문구로 변환합니다.
function getCategoryTitle(category: MapFilterCategory) {
  switch (category) {
    case "all":
      return "전체";
    case "oneRoom":
      return "원/투룸";
    case "apartment":
      return "아파트";
    case "houseVilla":
      return "주택/빌라";
    case "officetel":
      return "오피스텔";
    case "subscription":
      return "분양공고";
    default:
      return "매물";
  }
}