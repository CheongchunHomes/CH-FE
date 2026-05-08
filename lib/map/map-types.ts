export type MapListingCategory =
  | "oneRoom"
  | "apartment"
  | "villa"
  | "officetel"
  | "sale";

export type MapListing = {
  id: number;
  title: string;
  address: string;
  region: string;
  depositLabel: string;
  monthlyRentLabel?: string;
  latitude: number;
  longitude: number;
  tags: string[];
  category: MapListingCategory;
};