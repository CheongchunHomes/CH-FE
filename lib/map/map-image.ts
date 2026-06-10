export function getMapPropertyThumbnailImageUrl(propertyId: number | string) {
  return `/api/properties/${encodeURIComponent(String(propertyId))}/thumbnail-image`;
}
