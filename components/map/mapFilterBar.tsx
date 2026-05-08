"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import MapFilterDropdown, { type FilterType } from "./mapFilterDropdown";

const filterButtons: { label: string; type: FilterType }[] = [
  { label: "월세, 전체", type: "deal" },
  { label: "방크기", type: "roomSize" },
  { label: "사용승인일", type: "approvalDate" },
  { label: "층수", type: "floor" },
  { label: "추가필터", type: "extra" },
];

export default function MapFilterBar() {
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  const handleFilterClick = (type: FilterType) => {
    setActiveFilter((prev) => (prev === type ? null : type));
  };

  return (
    <div className="absolute left-5 top-5 z-10">
      <div className="flex items-center gap-2">
        {filterButtons.map((button) => {
          const isActive = activeFilter === button.type;

          return (
            <button
              key={button.type}
              type="button"
              onClick={() => handleFilterClick(button.type)}
              className={`flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm transition ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-slate-200 text-slate-800 hover:border-blue-300"
              }`}
            >
              {button.label}
              <span className="text-xs">{isActive ? "⌃" : "⌄"}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveFilter(null)}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
          aria-label="필터 초기화"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {activeFilter && <MapFilterDropdown activeFilter={activeFilter} />}
    </div>
  );
}