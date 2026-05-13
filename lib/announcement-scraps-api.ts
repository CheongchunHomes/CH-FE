import { get, post, request } from "@/lib/api";

export interface AnnouncementScrap {
  scrapId: number;
  announcementId: number;
  title: string;
  region: string;
  status: string;
  recuitmentType: string;
  targetType: string;
  supplyInstitution: string;
  applyStartDate: string;
  applyEndDate: string;
  scrapedAt: string;
}

// 내 스크랩 공고 목록 조회
export async function getMyAnnouncementScraps(): Promise<AnnouncementScrap[]> {
  return get<AnnouncementScrap[]>("/api/announcements-scraps/me", {
    cache: "no-store",
  });
}

// 내가 스크랩한 공고 ID 목록 조회
export async function getMyAnnouncementScrapIds(): Promise<number[]> {
  return get<number[]>("/api/announcements-scraps/me/ids", {
    cache: "no-store",
  });
}

// 공고 스크랩 등록
export async function addAnnouncementScrap(announcementId: number): Promise<void> {
  return post<void>(`/api/announcements-scraps/${announcementId}`, {});
}

// 공고 스크랩 취소
export async function removeAnnouncementScrap(announcementId: number): Promise<void> {
  return request<void>("DELETE", `/api/announcements-scraps/${announcementId}`);
}