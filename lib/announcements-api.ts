import { get } from "@/lib/api";

export interface Announcement {
  announcementId: number;
  title: string;
  region: string;
  address: string;
  status: string;
  recuitmentType: string;
  targetType: string;
  sourceUrl: string;
  applyStartDate: string;
  applyEndDate: string;
  supplyInstitution: string;
  totHshldCo: string;
  rentGtn: number;
  mtRntchrg: number;
  heatMthdNm: string;
  beginDe: string;
  endDe: string;
  content: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export async function getAnnouncements(params: {
  region?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<Announcement>> {
  const query = new URLSearchParams();
  if (params.region) query.append("region", params.region);
  if (params.status) query.append("status", params.status);
  query.append("page", String(params.page ?? 0));
  query.append("size", String(params.size ?? 10));

  return get<PageResponse<Announcement>>(`/api/announcements?${query}`);
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  return get<Announcement>(`/api/announcements/${id}`);
}
