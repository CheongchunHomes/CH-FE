import type { MapFilterCategory } from "@/lib/map/map-types";

type MapSiderCategoryMenuProps = {
  activeCategory: MapFilterCategory;
  onChangeCategory: (category: MapFilterCategory) => void;
  chatUnreadCount?: number;
  onOpenChatList?: () => void;
};

const categories: { key: MapFilterCategory; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "oneRoom", label: "원/투룸" },
  { key: "apartment", label: "아파트" },
  { key: "houseVilla", label: "주택/빌라" },
  { key: "officetel", label: "오피스텔" },
  { key: "subscription", label: "분양공고" },
];

export default function MapSiderCategoryMenu({
  activeCategory,
  onChangeCategory,
  chatUnreadCount = 0,
  onOpenChatList,
}: MapSiderCategoryMenuProps) {
  return (
    <nav className="w-[72px] border-r border-slate-100 bg-slate-50 py-4">
      {/* 매물 카테고리 메뉴입니다. */}
      {categories.map((category) => {
        const isActive = activeCategory === category.key;

        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onChangeCategory(category.key)}
            className={`mb-2 w-full px-2 py-3 text-xs font-semibold ${
              isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            {category.label}
          </button>
        );
      })}

      {/* 채팅 목록 메뉴입니다. */}
      <button
        type="button"
        onClick={onOpenChatList}
        className="relative mb-2 w-full px-2 py-3 text-xs font-semibold text-slate-600 hover:text-blue-600"
      >
        <span>채팅</span>

        {chatUnreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
            {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
          </span>
        )}
      </button>
    </nav>
  );
}