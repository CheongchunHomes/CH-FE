import { get } from "@/lib/api";

export interface Announcement {
  announcementId: number;
  title: string;
  region: string;
  address: string;
  status: string;
  recuitmentType: string;
  targetType: string;
  sourceType: string;
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
  surlus?: number | null;
  przwnerPresnatnDe?: string | null;
  cntrctCnclsBgnde?: string | null;
  cntrctCnclsEndde?: string | null;
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

export interface TodayAnnouncementCountResponse {
  count: number;
}

export async function getAnnouncements(params: {
  region?: string;
  status?: string;
  keyword?: string;
  sourceType?: string;
  targetType?: string;
  deadlineSoon?: boolean;
  areaType?: string,

  // 내 위치 기반 필터용
  latitude?: number;
  longitude?: number;
  locationFilter?: string;

  page?: number;
  size?: number;
}): Promise<PageResponse<Announcement>> {
  return get<PageResponse<Announcement>>("/api/announcements", {
    query: {
      region: params.region,
      status: params.status,
      keyword: params.keyword,
      sourceType: params.sourceType,
      targetType: params.targetType,
      deadlineSoon: params.deadlineSoon,
      areaType: params.areaType,

      // 내 위치 기반 필터용
      latitude: params.latitude,
      longitude: params.longitude,
      locationFilter: params.locationFilter,

      page: params.page ?? 0,
      size: params.size ?? 10,
    },
    cache: "no-store",
  });
}

export async function getTodayAnnouncementCount(): Promise<number> {
  const data = await get<TodayAnnouncementCountResponse>("/api/announcements/today-count", {
    cache: "no-store",
  });

  return data.count;
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  return get<Announcement>(`/api/announcements/${id}`, {
    cache: "no-store",
  });
}
