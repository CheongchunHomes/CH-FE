"use client";

import { useEffect, useMemo, useState } from "react";
import KakaoMap from "@/components/map/kakaoMap";
import MapFilterBar from "@/components/map/mapFilterBar";
import MapSidebar from "@/components/map/mapSiderbar";
import MapPropertyDetailPanel from "@/components/map/map-utils/mapPropertyDetailPanel";
import { DEFAULT_MAP_FILTERS, filterMapListings, normalizeMapListings } from "@/lib/map/map-filter";
import type { MapFilterCategory, MapFilterState, MapListing } from "@/lib/map/map-types";

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

  // 지도 매물 목록을 불러옵니다.
  useEffect(() => {
    const fetchMapListings = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/properties/map", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("매물 목록을 불러오지 못했습니다.");
        }

        const data: MapListing[] = await response.json();

        setListings(normalizeMapListings(data));
      } catch (error) {
        console.error(error);
        setErrorMessage("매물 목록을 불러오는 중 문제가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapListings();
  }, []);

  // 현재 필터에 맞는 매물 목록을 계산합니다.
  const filteredListings = useMemo(() => {
    return filterMapListings(listings, filters);
  }, [listings, filters]);

  // 사이드바에 표시할 목록을 결정합니다.
  const sidebarListings = selectedListings ?? filteredListings;

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

  // 클러스터 클릭 시 해당 클러스터의 매물 목록을 사이드바에 표시합니다.
  const handleClusterClick = (clusterListings: MapListing[]) => {
    setSelectedListings(clusterListings);
    setSelectedListing(null);
  };

  // 클러스터 선택 목록을 해제합니다.
  const handleClearSelection = () => {
    setSelectedListings(null);
    setSelectedListing(null);
  };

  // 사이드바 매물 카드 클릭 시 상세 패널을 엽니다.
  const handleSelectListing = (listing: MapListing) => {
    setSelectedListing(listing);
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
        {/* 왼쪽 매물 목록입니다. */}
        <MapSidebar
          listings={sidebarListings}
          activeCategory={filters.category}
          isSelectionMode={selectedListings !== null}
          onChangeCategory={handleChangeCategory}
          onClearSelection={handleClearSelection}
          onSelectListing={handleSelectListing}
        />

        {/* 가운데 매물 상세 패널입니다. */}
        <MapPropertyDetailPanel
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
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
        </section>
      </div>
    </main>
  );
}