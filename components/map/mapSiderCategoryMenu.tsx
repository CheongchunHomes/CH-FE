"use client";

export type MapCategoryType =
  | "oneRoom"
  | "apartment"
  | "villa"
  | "officetel"
  | "sale";

type MapCategory = {
  label: string;
  value: MapCategoryType;
};

const mapCategories: MapCategory[] = [
  { label: "원/투룸", value: "oneRoom" },
  { label: "아파트", value: "apartment" },
  { label: "주택/빌라", value: "villa" },
  { label: "오피스텔", value: "officetel" },
  { label: "분양", value: "sale" },
];

type MapCategoryMenuProps = {
  activeCategory: MapCategoryType;
  onChangeCategory: (category: MapCategoryType) => void;
};

export default function MapCategoryMenu({
  activeCategory,
  onChangeCategory,
}: MapCategoryMenuProps) {
  return (
    <nav className="w-[72px] border-r border-slate-100 bg-slate-50 py-4">
      {mapCategories.map((category) => {
        const isActive = activeCategory === category.value;

        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onChangeCategory(category.value)}
            className={`mb-2 w-full px-2 py-3 text-xs font-semibold transition ${
              isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </nav>
  );
}