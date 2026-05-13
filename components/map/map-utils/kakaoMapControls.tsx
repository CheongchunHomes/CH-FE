export function addMapControls(map: any) {
  // 일반 지도/스카이뷰 전환 컨트롤을 추가합니다.
  const mapTypeControl = new window.kakao.maps.MapTypeControl();

  map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

  // 지도 확대/축소 컨트롤을 추가합니다.
  const zoomControl = new window.kakao.maps.ZoomControl();

  map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
}
