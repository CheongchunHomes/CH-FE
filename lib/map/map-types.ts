export type MapListingCategory =
  | "oneRoom"
  | "apartment"
  | "villa"
  | "house"
  | "officetel"
  | "subscription";

export type MapFilterCategory =
  | "all"
  | "oneRoom"
  | "apartment"
  | "houseVilla"
  | "officetel"
  | "subscription";

export type MapDealType = "all" | "monthly" | "jeonse";

export type AreaFilter =
  | "all"
  | "under10"
  | "10to20"
  | "20to30"
  | "30to40"
  | "over40";

export type ApprovalDateFilter =
  | "all"
  | "under5y"
  | "under10y"
  | "under15y"
  | "over20y";

export type FloorFilter =
  | "all"
  | "first"
  | "low"
  | "middle"
  | "high";

export type MapListing = {
  id: number;
  title: string;
  address: string;
  region: string;
  latitude: number;
  longitude: number;
  category: MapListingCategory;
  dealType?: Exclude<MapDealType, "all"> | null;

  depositAmount?: number | null;
  monthlyRentAmount?: number | null;
  maintenanceFee?: number | null;
  depositLabel: string;
  monthlyRentLabel?: string | null;

  roomType?: string | null;
  exclusiveAreaM2?: number | null;
  supplyAreaM2?: number | null;
  roomCount?: number | null;
  bathroomCount?: number | null;

  floor?: number | null;
  totalFloor?: number | null;
  direction?: string | null;
  heatingType?: string | null;
  elevatorAvailable?: boolean | null;
  totalParkingCount?: number | null;
  buildingUse?: string | null;

  moveInType?: string | null;
  moveInDate?: string | null;
  approvalDate?: string | null;
  firstRegistrationDate?: string | null;

  tag: string[];
  options?: string[];
  securityFacilities?: string[];

  thumbnailUrl?: string | null;
  description?: string | null;
};

export type MapFilterState = {
  category: MapFilterCategory;
  dealType: MapDealType;
  area: AreaFilter;
  approvalDate: ApprovalDateFilter;
  floor: FloorFilter;

  maxDeposit: number | null;
  maxMonthlyRent: number | null;
  maxMaintenanceFee: number | null;

  tags: string[];
  options: string[];

  elevatorAvailable: boolean | null;
  parkingAvailable: boolean | null;
};