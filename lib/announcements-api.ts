const API_BASE_URL = "http://localhost:18080";

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

  const res = await fetch(`${API_BASE_URL}/api/announcements?${query}`);
  if (!res.ok) throw new Error("API 호출 실패");
  return res.json();
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/announcements/${id}`);
  if (!res.ok) throw new Error("API 호출 실패");
  return res.json();
}