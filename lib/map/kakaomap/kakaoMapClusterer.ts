import type { MapListing } from "@/lib/map/map-types";

function createSingleMarkerImage() {
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

export function addMarkerClusterer(map: any, listings: MapListing[]) {
  if (!window.kakao || !window.kakao.maps) return;

  const singleMarkerImage = createSingleMarkerImage();

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

  const markers = listings.map((listing) => {
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(
        listing.latitude,
        listing.longitude
      ),
      title: listing.title,
      image: singleMarkerImage, // 단일 마커도 파란 동그라미 + 1
    });

    const infoWindow = new window.kakao.maps.InfoWindow({
      content: `
        <div style="padding:12px; min-width:190px; font-size:13px; line-height:1.6;">
          <strong style="display:block; margin-bottom:6px; font-size:14px;">
            ${listing.title}
          </strong>
          <div>${listing.address}</div>
          <div style="margin-top:4px; font-weight:600;">
            ${listing.depositLabel} / ${listing.monthlyRentLabel}
          </div>
        </div>
      `,
    });

    window.kakao.maps.event.addListener(marker, "click", () => {
      infoWindow.open(map, marker);
    });

    return marker;
  });

  clusterer.addMarkers(markers);

  window.kakao.maps.event.addListener(
    clusterer,
    "clusterclick",
    function (cluster: any) {
      const level = map.getLevel() - 1;

      map.setLevel(level, {
        anchor: cluster.getCenter(),
      });
    }
  );

  return clusterer;
}