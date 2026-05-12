"use client";

import { useEffect, useRef, useState } from "react";
import type { MapListing } from "@/lib/map/map-types";
import { addMapControls } from "./map-utils/kakaoMapControls";
import { addMarkerClusterer } from "@/lib/map/kakaomap/kakaoMapClusterer";

declare global {
  interface Window {
    kakao: any;
  }
}

type KakaoMapProps = {
  listings: MapListing[];
  onSingleMarkerClick: (listing: MapListing) => void;
  onClusterClick: (clusterListings: MapListing[]) => void;
};

export default function KakaoMap({
  listings,
  onSingleMarkerClick,
  onClusterClick,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // 카카오맵 SDK는 한 번만 불러옵니다.
  useEffect(() => {
    const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!kakaoMapKey) {
      console.error("NEXT_PUBLIC_KAKAO_MAP_KEY 값이 없습니다.");
      return;
    }

    const initMap = () => {
      if (!mapRef.current) return;

      if (!window.kakao || !window.kakao.maps) {
        console.error("카카오맵 SDK가 아직 로드되지 않았습니다.");
        return;
      }

      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        if (mapInstanceRef.current) {
          setIsMapReady(true);
          return;
        }

        const center = new window.kakao.maps.LatLng(37.5665, 126.978);

        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 7,
        });

        mapInstanceRef.current = map;

        addMapControls(map);
        setIsMapReady(true);

        console.log("카카오맵 생성 완료");
      });
    };

    const existingScript = document.getElementById(
      "kakao-map-script"
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.kakao && window.kakao.maps) {
        initMap();
      } else {
        existingScript.addEventListener("load", initMap);
      }

      return;
    }

    // 카카오맵 SDK 스크립트를 동적으로 불러옵니다.
    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    script.onload = initMap;

    script.onerror = () => {
      console.error("카카오맵 SDK 스크립트 로드 실패:", script.src);
    };

    document.head.appendChild(script);
  }, []);

  // 매물 목록이 바뀔 때마다 마커와 클러스터를 다시 그립니다.
  useEffect(() => {
    if (!isMapReady) return;
    if (!mapInstanceRef.current) return;
    if (!window.kakao || !window.kakao.maps) return;

    const map = mapInstanceRef.current;

    if (clustererRef.current) {
      clustererRef.current.clear();
      clustererRef.current = null;
    }

    if (listings.length === 0) {
      console.log("지도에 표시할 매물이 없습니다.");
      return;
    }

      const clusterer = addMarkerClusterer(map, listings, {
        onSingleMarkerClick,
        onClusterClick,
      });

    clustererRef.current = clusterer;

    console.log("마커 생성 완료", listings.length);
  }, [isMapReady, listings, onSingleMarkerClick, onClusterClick]);

  return <div ref={mapRef} className="h-full w-full min-h-[500px]" />;
}