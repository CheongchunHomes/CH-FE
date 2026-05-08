"use client";

import { useState } from "react";
import { mapSampleListings } from "@/lib/map/map-sample-data";
import MapListingCard from "./mapListngCard";
import MapCategoryMenu, { type MapCategoryType } from "./mapSiderCategoryMenu";

export default function MapSidebar() {
  const [activeCategory, setActiveCategory] =
    useState<MapCategoryType>("oneRoom");

    const filteredListings = mapSampleListings.filter(
        (item) => item.category === activeCategory
        );

  return (
    <aside className="h-full w-[380px] shrink-0 border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h1 className="text-lg font-bold text-slate-900">집·공고 확인</h1>
        <p className="mt-1 text-sm text-slate-500">
          청년 주거 공고와 매물을 지도에서 확인하세요.
        </p>
      </div>

      <div className="flex h-[calc(100%-73px)]">
        <MapCategoryMenu
          activeCategory={activeCategory}
          onChangeCategory={setActiveCategory}
        />

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white">
            {getCategoryTitle(activeCategory)}
          </div>

         <div className="space-y-4">
            {filteredListings.map((item) => (
                <MapListingCard key={item.id} item={item} />
            ))}
            </div>
        </div>
      </div>
    </aside>
  );
}

function getCategoryTitle(category: MapCategoryType) {
  switch (category) {
    case "oneRoom":
      return "원/투룸";
    case "apartment":
      return "아파트";
    case "villa":
      return "주택/빌라";
    case "officetel":
      return "오피스텔";
    case "sale":
      return "분양";
    default:
      return "매물";
  }
}
