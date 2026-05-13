import type { MapListing } from "@/lib/map/map-types";

type AddMarkerClustererOptions = {
  onSingleMarkerClick?: (listing: MapListing) => void;
  onClusterClick?: (listings: MapListing[]) => void;
};

function createSingleMarkerImage() {
  // 개별 매물 마커 이미지를 SVG로 생성합니다.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="24" fill="#3B82F6" fill-opacity="0.92" stroke="white" stroke-width="2"/>
      <text x="26" y="31" text-anchor="middle" font-size="20" font-weight="700" fill="white">1</text>
    </svg>
  `;

  const imageSrc = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const imageSize = new window.kakao.maps.Size(52, 52);
  const imageOption = {
    offset: new window.kakao.maps.Point(26, 26),
  };

  return new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
}

export function addMarkerClusterer(
  map: any,
  listings: MapListing[],
  options?: AddMarkerClustererOptions
) {
  if (!window.kakao || !window.kakao.maps) return;

  const singleMarkerImage = createSingleMarkerImage();

  // 여러 마커를 보기 좋게 묶어주는 클러스터러를 생성합니다.
  const clusterer = new window.kakao.maps.MarkerClusterer({
    map,
    averageCenter: true,
    minLevel: 6,
    disableClickZoom: true,
    styles: [
      {
        width: "56px",
        height: "56px",
        background: "rgba(59, 130, 246, 0.92)",
        borderRadius: "9999px",
        color: "#ffffff",
        textAlign: "center",
        fontWeight: "700",
        fontSize: "22px",
        lineHeight: "56px",
        border: "2px solid #ffffff",
        boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
      },
    ],
  });

  // 각 매물 좌표를 카카오맵 마커로 변환합니다.
  const markers = listings.map((listing) => {
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(
        listing.latitude,
        listing.longitude
      ),
      title: listing.title,
      image: singleMarkerImage,
    });

    // 클러스터 클릭 시 어떤 매물인지 찾기 위해 저장합니다.
    (marker as any).listing = listing;

    // 개별 마커 클릭 시 사이드바에 해당 매물만 표시합니다.
    window.kakao.maps.event.addListener(marker, "click", () => {
      options?.onSingleMarkerClick?.(listing);
    });

    return marker;
  });

  clusterer.addMarkers(markers);

  // 클러스터 클릭 시 묶인 매물 목록을 사이드바에 표시합니다.
  window.kakao.maps.event.addListener(
    clusterer,
    "clusterclick",
    function (cluster: any) {
      const clusterMarkers = cluster.getMarkers();

      const clusterListings = clusterMarkers
        .map((marker: any) => marker.listing)
        .filter(Boolean);

      options?.onClusterClick?.(clusterListings);

      map.panTo(cluster.getCenter());
    }
  );

  return clusterer;
}
