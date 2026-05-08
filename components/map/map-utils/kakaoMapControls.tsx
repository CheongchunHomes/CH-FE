export function addMapControls(map: any) {
  const mapTypeControl = new window.kakao.maps.MapTypeControl();

  map.addControl(
    mapTypeControl,
    window.kakao.maps.ControlPosition.TOPRIGHT
  );

  const zoomControl = new window.kakao.maps.ZoomControl();

  map.addControl(
    zoomControl,
    window.kakao.maps.ControlPosition.RIGHT
  );
}