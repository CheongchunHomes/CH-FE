import type { MapFilterCategory } from "@/lib/map/map-types";

type MapSiderCategoryMenuProps = {
  activeCategory: MapFilterCategory;
  onChangeCategory: (category: MapFilterCategory) => void;
};

const categories: {
  key: MapFilterCategory;
  label: string;
}[] = [
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
}: MapSiderCategoryMenuProps) {
  return (
    <nav className="w-[72px] border-r border-slate-100 bg-slate-50 py-4">
      {categories.map((category) => (
        <button
          key={category.key}
          type="button"
          onClick={() => onChangeCategory(category.key)}
          className={`mb-2 w-full px-2 py-3 text-xs font-semibold ${
            activeCategory === category.key
              ? "text-blue-600"
              : "text-slate-600 hover:text-blue-600"
          }`}
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
}