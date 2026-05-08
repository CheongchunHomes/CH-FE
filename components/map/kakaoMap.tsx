"use client";

import { useEffect, useRef } from "react";
import { addMapControls } from "./map-utils/kakaoMapControls";
import { addListingMarkers } from "../../lib/map/kakaomap/kakaoMapMarkers";
import { mapSampleListings } from "@/lib/map/map-sample-data";
import { addMarkerClusterer } from "../../lib/map/kakaomap/kakaoMapClusterer";


// TypeScript에서 window.kakao를 사용할 수 있게 타입 선언
// 기본 window 객체에는 kakao라는 속성이 없기 때문에 직접 알려주는 역할
declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap() {
  // 카카오맵을 표시할 div를 참조하기 위한 ref
  // 실제 DOM 요소에 접근할 때 사용
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // .env.local에 저장된 카카오맵 JavaScript 키 가져오기
    // NEXT_PUBLIC_이 붙어야 브라우저에서 접근 가능
    const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    // 카카오맵 키가 없으면 지도 로딩을 중단
    if (!kakaoMapKey) {
      console.error("NEXT_PUBLIC_KAKAO_MAP_KEY 값이 없습니다.");
      return;
    }

    // 실제 지도를 생성하는 함수
    const initMap = () => {
      // 지도 div가 아직 준비되지 않았으면 중단
      if (!mapRef.current) return;

      // 카카오맵 SDK가 정상적으로 로드되었는지 확인
      if (!window.kakao || !window.kakao.maps) {
        console.error("카카오맵 SDK가 아직 로드되지 않았습니다.");
        return;
      }

      // autoload=false로 SDK를 불러왔기 때문에
      // kakao.maps.load 안에서 지도를 생성해야 안전함
   window.kakao.maps.load(() => {
        const firstListing = mapSampleListings[0];

        const center = new window.kakao.maps.LatLng(
            firstListing.latitude,
            firstListing.longitude
        );

        const map = new window.kakao.maps.Map(mapRef.current, {
            center,
            level: 7,
        });

        addMapControls(map);
        //addListingMarkers(map, mapSampleListings);
        addMarkerClusterer(map,mapSampleListings);
        });
    };

    // 이미 카카오맵 SDK script가 추가되어 있는지 확인
    // 페이지 이동이나 컴포넌트 재렌더링 시 script가 중복 추가되는 것을 방지
    const existingScript = document.getElementById(
      "kakao-map-script"
    ) as HTMLScriptElement | null;

    // 이미 script가 있으면 새로 만들지 않고 지도만 초기화
   if (existingScript) {
    if (window.kakao && window.kakao.maps) {
        initMap();
    } else {
        existingScript.onload = initMap;
    }
    return;
    }

    // 카카오맵 SDK script 태그 생성
    const script = document.createElement("script");

    // script에 id를 부여해서 중복 로딩을 방지
    script.id = "kakao-map-script";

    // 카카오맵 SDK 주소
    // autoload=false는 SDK 로드 후 직접 kakao.maps.load를 호출하겠다는 의미
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services,clusterer,drawing`;

    // 비동기로 script 로드
    script.async = true;

    // script 로드가 완료되면 지도 초기화 실행
    script.onload = initMap;

    // script 로드 실패 시 에러 출력
    script.onerror = () => {
      console.error("카카오맵 SDK 스크립트 로드 실패");
    };

    // head 태그 안에 카카오맵 SDK script 추가
    document.head.appendChild(script);


  }, []);

  // 실제 지도가 그려질 영역
  // 부모 요소의 크기를 그대로 채우기 위해 h-full w-full 사용
  return <div ref={mapRef} className="h-full w-full" />;
}