import type { MapListing } from "@/lib/map/map-types";

type KakaoLatLng = unknown;

type KakaoMap = {
  panTo: (center: KakaoLatLng) => void;
};

export function addListingMarkers(map: KakaoMap, listings: MapListing[]) {
  if (!window.kakao || !window.kakao.maps) return;

  listings.forEach((listing) => {
    const position = new window.kakao.maps.LatLng(
      listing.latitude,
      listing.longitude
    );

    const markerElement = document.createElement("button");

    markerElement.type = "button";
    markerElement.innerText = "1";

    markerElement.style.width = "52px";
    markerElement.style.height = "52px";
    markerElement.style.borderRadius = "9999px";
    markerElement.style.border = "none";
    markerElement.style.background = "#2563eb";
    markerElement.style.color = "#ffffff";
    markerElement.style.fontSize = "18px";
    markerElement.style.fontWeight = "700";
    markerElement.style.boxShadow = "0 6px 14px rgba(37, 99, 235, 0.35)";
    markerElement.style.cursor = "pointer";
    markerElement.style.display = "flex";
    markerElement.style.alignItems = "center";
    markerElement.style.justifyContent = "center";

    new window.kakao.maps.CustomOverlay({
      map,
      position,
      content: markerElement,
      yAnchor: 1,
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

    const hiddenMarker = new window.kakao.maps.Marker({
      position,
    });

    markerElement.addEventListener("click", () => {
      map.panTo(position);
      infoWindow.open(map, hiddenMarker);
    });
  });
}
