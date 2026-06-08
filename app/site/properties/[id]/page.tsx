import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveMapImageUrl } from "@/lib/map/map-image";
import type { MapListing } from "@/lib/map/map-types";

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getProperty(id: string): Promise<MapListing | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/properties/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("매물 상세 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const tags = Array.isArray(property.tag) ? property.tag : [];
  const options = Array.isArray(property.options) ? property.options : [];
  const securityFacilities = Array.isArray(property.securityFacilities)
    ? property.securityFacilities
    : [];
  const thumbnailUrl = resolveMapImageUrl(property.thumbnailUrl);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        {/* 이전 화면으로 이동합니다. */}
        <Link
          href="/site/map"
          className="mb-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← 지도 목록으로 돌아가기
        </Link>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* 상세 상단 영역입니다. */}
          <div className="relative h-72 bg-gradient-to-br from-slate-200 to-slate-300">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={property.title}
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {getCategoryLabel(property.category)}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {property.title}
                </h1>

                <p className="mt-3 text-base text-slate-500">
                  {property.address}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full rounded-2xl border border-slate-200 p-5 lg:w-80">
                <p className="text-sm text-slate-500">거래 금액</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {property.depositLabel}
                </p>
                {property.monthlyRentLabel && (
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {property.monthlyRentLabel}
                  </p>
                )}
                {property.maintenanceFee !== null &&
                  property.maintenanceFee !== undefined && (
                    <p className="mt-3 text-sm text-slate-500">
                      관리비 {property.maintenanceFee}만 원
                    </p>
                  )}

                <button
                  type="button"
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  거래 요청하기
                </button>

                <button
                  type="button"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  관심 매물 저장
                </button>
              </div>
            </div>

            {/* 기본 정보를 출력합니다. */}
            <DetailSection title="기본 정보">
              <DetailGrid>
                <DetailItem label="지역" value={property.region} />
                <DetailItem label="거래유형" value={getDealTypeLabel(property.dealType)} />
                <DetailItem label="방종류" value={property.roomType} />
                <DetailItem
                  label="전용면적"
                  value={formatArea(property.exclusiveAreaM2)}
                />
                <DetailItem
                  label="공급면적"
                  value={formatArea(property.supplyAreaM2)}
                />
                <DetailItem
                  label="방 / 욕실"
                  value={`${property.roomCount ?? "-"}개 / ${
                    property.bathroomCount ?? "-"
                  }개`}
                />
                <DetailItem
                  label="층수"
                  value={`${property.floor ?? "-"}층 / 총 ${
                    property.totalFloor ?? "-"
                  }층`}
                />
                <DetailItem label="방향" value={property.direction} />
              </DetailGrid>
            </DetailSection>

            {/* 건물 정보를 출력합니다. */}
            <DetailSection title="건물 정보">
              <DetailGrid>
                <DetailItem label="난방" value={property.heatingType} />
                <DetailItem
                  label="엘리베이터"
                  value={
                    property.elevatorAvailable === true
                      ? "있음"
                      : property.elevatorAvailable === false
                        ? "없음"
                        : "-"
                  }
                />
                <DetailItem
                  label="총 주차대수"
                  value={
                    property.totalParkingCount !== null &&
                    property.totalParkingCount !== undefined
                      ? `${property.totalParkingCount}대`
                      : "-"
                  }
                />
                <DetailItem label="건축물 용도" value={property.buildingUse} />
                <DetailItem label="입주 유형" value={property.moveInType} />
                <DetailItem label="입주 가능일" value={property.moveInDate} />
                <DetailItem label="사용승인일" value={property.approvalDate} />
                <DetailItem
                  label="최초등록일"
                  value={property.firstRegistrationDate}
                />
              </DetailGrid>
            </DetailSection>

            {/* 옵션 정보를 출력합니다. */}
            <DetailSection title="옵션">
              <BadgeList items={options} emptyText="등록된 옵션이 없습니다." />
            </DetailSection>

            {/* 보안시설 정보를 출력합니다. */}
            <DetailSection title="보안 및 안전시설">
              <BadgeList
                items={securityFacilities}
                emptyText="등록된 보안시설이 없습니다."
              />
            </DetailSection>

            {/* 설명 정보를 출력합니다. */}
            <DetailSection title="매물 설명">
              <p className="leading-7 text-slate-600">
                {property.description || "등록된 매물 설명이 없습니다."}
              </p>
            </DetailSection>
          </div>
        </section>
      </div>
    </main>
  );
}

type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
};

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

type DetailGridProps = {
  children: React.ReactNode;
};

function DetailGrid({ children }: DetailGridProps) {
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

type DetailItemProps = {
  label: string;
  value?: string | number | null;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

type BadgeListProps = {
  items: string[];
  emptyText: string;
};

function BadgeList({ items, emptyText }: BadgeListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function getCategoryLabel(category: string) {
  switch (category) {
    case "oneRoom":
      return "원/투룸";
    case "apartment":
      return "아파트";
    case "villa":
      return "빌라";
    case "house":
      return "주택";
    case "officetel":
      return "오피스텔";
    case "subscription":
      return "분양공고";
    default:
      return "매물";
  }
}

function getDealTypeLabel(dealType?: string | null) {
  switch (dealType) {
    case "monthly":
      return "월세";
    case "jeonse":
      return "전세";
    default:
      return "-";
  }
}

function formatArea(area?: number | null) {
  if (area === null || area === undefined) {
    return "-";
  }

  return `${area}㎡`;
}
