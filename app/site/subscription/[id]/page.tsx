"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError, get } from "@/lib/api";

type ApplyType = "SPECIAL" | "FIRST" | "SECOND" | "REMAIN";

type AnnouncementDetail = {
  announcementId: number;
  title: string;
  region: string | null;
  recuitmentType: string | null;
  status: string | null;
  applyStartDate: string | null;
  applyEndDate: string | null;
  address: string | null;
  targetType: string | null;
  supplyInstitution: string | null;
  totHshldCo: string | null;
  rentGtn: number | null;
  mtRntchrg: number | null;
  heatMthdNm: string | null;
  beginDe: string | null;
  endDe: string | null;
  content: string | null;
};

type SubscriptionHouseType = {
  houseTypeId: number;
  announcementId: number;
  houseManageNo: string | null;
  pblancNo: string | null;
  modelNo: string | null;
  houseTypeName: string | null;
  exclusiveArea: string | null;
  supplyHouseholdCount: number | null;
  specialSupplyCount: number | null;
  generalSupplyCount: number | null;
  supplyPrice: number | null;
  rentDeposit: number | null;
  monthlyRent: number | null;
};

const applyTypeOptions: {
  value: ApplyType;
  label: string;
  description: string;
}[] = [
  {
    value: "SPECIAL",
    label: "특별공급",
    description: "생애최초, 신혼부부, 다자녀 등 특별공급 유형",
  },
  {
    value: "FIRST",
    label: "1순위",
    description: "청약통장 및 지역 조건 등을 기준으로 신청",
  },
  {
    value: "SECOND",
    label: "2순위",
    description: "1순위 외 일반 신청 유형",
  },
  {
    value: "REMAIN",
    label: "잔여세대",
    description: "잔여 물량 또는 무순위 성격의 신청 유형",
  },
];

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const announcementId = params.id;

  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(
    null,
  );
  const [houseTypes, setHouseTypes] = useState<SubscriptionHouseType[]>([]);
  const [selectedHouseType, setSelectedHouseType] =
    useState<SubscriptionHouseType | null>(null);
  const [selectedApplyType, setSelectedApplyType] = useState<ApplyType | "">("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [houseTypeLoading, setHouseTypeLoading] = useState(false);

  useEffect(() => {
    if (!announcementId) {
      return;
    }

    fetchAnnouncementDetail();
    fetchHouseTypes();
  }, [announcementId]);

  async function fetchAnnouncementDetail() {
    setDetailLoading(true);

    try {
      const data = await get<AnnouncementDetail>(
        `/api/announcements/${announcementId}`,
        {
          cache: "no-store",
        },
      );

      setAnnouncement(data);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("공고 상세 조회 실패:", error.status, error.message);
      } else {
        console.error("공고 상세 조회 실패:", error);
      }

      setAnnouncement(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function fetchHouseTypes() {
    setHouseTypeLoading(true);

    try {
      const data = await get<SubscriptionHouseType[]>("/api/subscription", {
        query: {
          announcementId,
        },
        cache: "no-store",
      });

      setHouseTypes(data);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("주택형 목록 조회 실패:", error.status, error.message);
      } else {
        console.error("주택형 목록 조회 실패:", error);
      }

      setHouseTypes([]);
    } finally {
      setHouseTypeLoading(false);
    }
  }

  const handleApply = () => {
    if (!selectedHouseType) {
      alert("신청할 주택형을 선택해 주세요.");
      return;
    }

    if (!selectedApplyType) {
      alert("신청 타입을 선택해 주세요.");
      return;
    }

    const query = new URLSearchParams({
      title: announcement?.title ?? "",
      houseTypeId: String(selectedHouseType.houseTypeId),
      houseTypeName: selectedHouseType.houseTypeName ?? "",
      applyType: selectedApplyType,
    });

    router.push(`/site/subscription/${announcementId}/apply?${query.toString()}`);
  };

  if (detailLoading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <EmptyBox text="공고 상세 정보를 불러오는 중입니다." />
        </div>
      </main>
    );
  }

  if (!announcement) {
    return (
      <main className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <EmptyBox text="공고 상세 정보를 찾을 수 없습니다." />

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-lg border px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            뒤로가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
        >
          뒤로가기
        </button>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {announcement.status ?? "상태 미정"}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {announcement.title}
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <InfoRow label="공고번호" value={announcement.announcementId} />
            <InfoRow label="모집유형" value={announcement.recuitmentType} />
            <InfoRow label="대상" value={announcement.targetType} />
            <InfoRow label="지역" value={announcement.region} />
            <InfoRow label="주소" value={announcement.address} />
            <InfoRow label="공급기관" value={announcement.supplyInstitution} />
            <InfoRow
              label="접수기간"
              value={`${announcement.applyStartDate ?? "-"} ~ ${
                announcement.applyEndDate ?? "-"
              }`}
            />
            <InfoRow
              label="공고기간"
              value={`${announcement.beginDe ?? "-"} ~ ${
                announcement.endDe ?? "-"
              }`}
            />
            <InfoRow label="총 세대수" value={announcement.totHshldCo} />
            <InfoRow
              label="임대보증금"
              value={formatPrice(announcement.rentGtn)}
            />
            <InfoRow
              label="월 임대료"
              value={formatPrice(announcement.mtRntchrg)}
            />
            <InfoRow label="난방방식" value={announcement.heatMthdNm} />
          </div>

          {announcement.content && (
            <div className="mt-8 rounded-xl bg-gray-50 p-5">
              <h2 className="text-base font-bold text-gray-900">공고 내용</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                {announcement.content}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                주택형 선택
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                신청할 주택형을 먼저 선택해 주세요.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchHouseTypes}
              className="rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>

          {houseTypeLoading ? (
            <div className="mt-4">
              <EmptyBox text="주택형 정보를 불러오는 중입니다." />
            </div>
          ) : houseTypes.length === 0 ? (
            <div className="mt-4">
              <EmptyBox text="등록된 주택형 정보가 없습니다. 타입 import 여부를 확인해 주세요." />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {houseTypes.map((houseType) => {
                const isSelected =
                  selectedHouseType?.houseTypeId === houseType.houseTypeId;

                return (
                  <button
                    key={houseType.houseTypeId}
                    type="button"
                    onClick={() => setSelectedHouseType(houseType)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`text-lg font-bold ${
                          isSelected ? "text-blue-700" : "text-gray-900"
                        }`}
                      >
                        {houseType.houseTypeName ?? "주택형 미정"}
                      </p>

                      {isSelected && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                          선택됨
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>전용면적: {houseType.exclusiveArea ?? "-"}</p>
                      <p>공급세대: {houseType.supplyHouseholdCount ?? "-"}세대</p>
                      <p>특별공급: {houseType.specialSupplyCount ?? "-"}세대</p>
                      <p>일반공급: {houseType.generalSupplyCount ?? "-"}세대</p>
                    </div>

                    <p className="mt-3 text-sm font-bold text-gray-900">
                      공급금액: {formatPrice(houseType.supplyPrice)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">신청 타입 선택</h2>
          <p className="mt-2 text-sm text-gray-600">
            신청하기 전에 본인이 신청할 타입을 선택해 주세요.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            {applyTypeOptions.map((option) => {
              const isSelected = selectedApplyType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedApplyType(option.value)}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-bold">{option.label}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              선택 주택형:{" "}
              <span className="font-bold text-gray-900">
                {selectedHouseType?.houseTypeName ?? "미선택"}
              </span>
            </p>
            <p className="mt-1">
              선택 신청 타입:{" "}
              <span className="font-bold text-gray-900">
                {getApplyTypeLabel(selectedApplyType) || "미선택"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            신청하기
          </button>
        </section>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl border bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value ?? "-"}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border bg-gray-50 text-sm text-gray-500">
      {text}
    </div>
  );
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toLocaleString()}원`;
}

function getApplyTypeLabel(value: ApplyType | "") {
  if (!value) {
    return "";
  }

  const option = applyTypeOptions.find((item) => item.value === value);
  return option?.label ?? value;
}