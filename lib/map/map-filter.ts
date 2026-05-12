import type { MapFilterState, MapListing } from "./map-types";

export const DEFAULT_MAP_FILTERS: MapFilterState = {
  category: "all",
  dealType: "all",
  area: "all",
  approvalDate: "all",
  floor: "all",

  maxDeposit: null,
  maxMonthlyRent: null,
  maxMaintenanceFee: null,

  tags: [],
  options: [],

  elevatorAvailable: null,
  parkingAvailable: null,
};

// 배열 값을 안전하게 변환합니다.
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

// 백엔드 응답값을 프론트에서 안전하게 사용할 수 있게 정리합니다.
export function normalizeMapListings(listings: MapListing[]): MapListing[] {
  return listings.map((listing) => ({
    ...listing,
    tag: toStringArray(listing.tag),
    options: toStringArray(listing.options),
    securityFacilities: toStringArray(listing.securityFacilities),
  }));
}

// 주택/빌라 필터는 house와 villa를 함께 처리합니다.
function matchCategory(
  listing: MapListing,
  category: MapFilterState["category"]
) {
  if (category === "all") return true;

  if (category === "houseVilla") {
    return listing.category === "house" || listing.category === "villa";
  }

  return listing.category === category;
}

// 전용면적 필터를 확인합니다.
function matchArea(
  area: number | null | undefined,
  filter: MapFilterState["area"]
) {
  if (filter === "all") return true;
  if (area === null || area === undefined) return false;

  switch (filter) {
    case "under10":
      return area <= 10;
    case "10to20":
      return area > 10 && area <= 20;
    case "20to30":
      return area > 20 && area <= 30;
    case "30to40":
      return area > 30 && area <= 40;
    case "over40":
      return area > 40;
    default:
      return true;
  }
}

// 사용승인일 필터를 확인합니다.
function matchApprovalDate(
  approvalDate: string | null | undefined,
  filter: MapFilterState["approvalDate"]
) {
  if (filter === "all") return true;
  if (!approvalDate) return false;

  const approvedYear = new Date(approvalDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - approvedYear;

  switch (filter) {
    case "under5y":
      return age <= 5;
    case "under10y":
      return age <= 10;
    case "under15y":
      return age <= 15;
    case "over20y":
      return age >= 20;
    default:
      return true;
  }
}

// 층수 필터를 확인합니다.
function matchFloor(
  floor: number | null | undefined,
  filter: MapFilterState["floor"]
) {
  if (filter === "all") return true;
  if (floor === null || floor === undefined) return false;

  switch (filter) {
    case "first":
      return floor === 1;
    case "low":
      return floor >= 1 && floor <= 3;
    case "middle":
      return floor >= 4 && floor <= 9;
    case "high":
      return floor >= 10;
    default:
      return true;
  }
}

// 지도와 사이드바가 같은 필터 결과를 보도록 매물 목록을 걸러냅니다.
export function filterMapListings(
  listings: MapListing[],
  filters: MapFilterState
) {
  return listings.filter((listing) => {
    const depositAmount = listing.depositAmount ?? 0;
    const monthlyRentAmount = listing.monthlyRentAmount ?? 0;
    const maintenanceFee = listing.maintenanceFee ?? 0;
    const tags = Array.isArray(listing.tag) ? listing.tag : [];
    const options = Array.isArray(listing.options) ? listing.options : [];

    // 카테고리 조건을 확인합니다.
    if (!matchCategory(listing, filters.category)) {
      return false;
    }

    // 거래유형 조건을 확인합니다.
    if (filters.dealType !== "all" && listing.dealType !== filters.dealType) {
      return false;
    }

    // 전용면적 조건을 확인합니다.
    if (!matchArea(listing.exclusiveAreaM2, filters.area)) {
      return false;
    }

    // 사용승인일 조건을 확인합니다.
    if (!matchApprovalDate(listing.approvalDate, filters.approvalDate)) {
      return false;
    }

    // 층수 조건을 확인합니다.
    if (!matchFloor(listing.floor, filters.floor)) {
      return false;
    }

    // 보증금 상한 조건을 확인합니다.
    if (filters.maxDeposit !== null && depositAmount > filters.maxDeposit) {
      return false;
    }

    // 월세 상한 조건을 확인합니다.
    if (
      filters.maxMonthlyRent !== null &&
      monthlyRentAmount > filters.maxMonthlyRent
    ) {
      return false;
    }

    // 관리비 상한 조건을 확인합니다.
    if (
      filters.maxMaintenanceFee !== null &&
      maintenanceFee > filters.maxMaintenanceFee
    ) {
      return false;
    }

    // 엘리베이터 조건을 확인합니다.
    if (
      filters.elevatorAvailable !== null &&
      listing.elevatorAvailable !== filters.elevatorAvailable
    ) {
      return false;
    }

    // 주차 가능 조건을 확인합니다.
    if (filters.parkingAvailable !== null) {
      const parkingCount = listing.totalParkingCount ?? 0;
      const hasParking = parkingCount > 0;

      if (hasParking !== filters.parkingAvailable) {
        return false;
      }
    }

    // 선택한 태그가 모두 포함되어 있는지 확인합니다.
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => tags.includes(tag));

      if (!hasAllTags) {
        return false;
      }
    }

    // 선택한 옵션이 모두 포함되어 있는지 확인합니다.
    if (filters.options.length > 0) {
      const hasAllOptions = filters.options.every((option) =>
        options.includes(option)
      );

      if (!hasAllOptions) {
        return false;
      }
    }

    return true;
  });
}