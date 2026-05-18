"use client";

import type { MapListing } from "@/lib/map/map-types";

type MapPropertyDetailPanelProps = {
  listing: MapListing | null;
  onClose: () => void;
  onOpenChat?: (listing: MapListing) => void;
  isOpeningChat?: boolean;
};

export default function MapPropertyDetailPanel({
  listing,
  onClose,
  onOpenChat,
  isOpeningChat = false,
}: MapPropertyDetailPanelProps) {
  if (!listing) {
    return null;
  }

  const tags = Array.isArray(listing.tag) ? listing.tag : [];
  const options = Array.isArray(listing.options) ? listing.options : [];
  const securityFacilities = Array.isArray(listing.securityFacilities)
    ? listing.securityFacilities
    : [];

  return (
    <aside className="h-full w-[430px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white shadow-sm">
      {/* 상세 패널 상단입니다. */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-blue-600">
            {getCategoryLabel(listing.category)}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            매물 {listing.id}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          ×
        </button>
      </div>

      {/* 대표 이미지 영역입니다. */}
      <div className="h-64 bg-slate-200">
        {listing.thumbnailUrl ? (
          <img
            src={listing.thumbnailUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
            이미지 준비중
          </div>
        )}
      </div>

      <div className="p-5">
        {/* 매물 제목과 가격입니다. */}
        <div>
          <p className="text-xs font-semibold text-slate-400">
            매물번호 {listing.id}
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            {listing.depositLabel}
            {listing.monthlyRentLabel ? ` / ${listing.monthlyRentLabel}` : ""}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {listing.address}
          </p>

          {listing.maintenanceFee !== null &&
            listing.maintenanceFee !== undefined && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                관리비 {listing.maintenanceFee}만 원
              </p>
            )}
        </div>

        {/* 핵심 정보입니다. */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <InfoItem label="방종류" value={listing.roomType} />
          <InfoItem label="전용면적" value={formatArea(listing.exclusiveAreaM2)} />
          <InfoItem
            label="층수"
            value={`${listing.floor ?? "-"}층 / ${listing.totalFloor ?? "-"}층`}
          />
          <InfoItem
            label="방/욕실"
            value={`${listing.roomCount ?? "-"}개 / ${
              listing.bathroomCount ?? "-"
            }개`}
          />
          <InfoItem label="방향" value={listing.direction} />
          <InfoItem label="난방" value={listing.heatingType} />
          <InfoItem
            label="엘리베이터"
            value={
              listing.elevatorAvailable === true
                ? "있음"
                : listing.elevatorAvailable === false
                  ? "없음"
                  : "-"
            }
          />
          <InfoItem
            label="주차"
            value={
              listing.totalParkingCount !== null &&
              listing.totalParkingCount !== undefined
                ? `${listing.totalParkingCount}대`
                : "-"
            }
          />
        </div>
          {/* CTA 버튼입니다. */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100"
            >
              전화문의
            </button>

            <button
              type="button"
              onClick={() => onOpenChat?.(listing)}
              disabled={isOpeningChat}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isOpeningChat ? "채팅방 여는 중..." : "채팅하기"}
            </button>
          </div>

        {/* 태그입니다. */}
        <DetailSection title="태그">
          <BadgeList items={tags} emptyText="등록된 태그가 없습니다." />
        </DetailSection>

        {/* 옵션입니다. */}
        <DetailSection title="옵션">
          <BadgeList items={options} emptyText="등록된 옵션이 없습니다." />
        </DetailSection>

        {/* 보안시설입니다. */}
        <DetailSection title="보안시설">
          <BadgeList
            items={securityFacilities}
            emptyText="등록된 보안시설이 없습니다."
          />
        </DetailSection>

        {/* 입주 정보입니다. */}
        <DetailSection title="입주 및 건물 정보">
          <div className="space-y-2 text-sm text-slate-600">
            <InfoLine label="입주 유형" value={listing.moveInType} />
            <InfoLine label="입주 가능일" value={listing.moveInDate} />
            <InfoLine label="사용승인일" value={listing.approvalDate} />
            <InfoLine label="최초등록일" value={listing.firstRegistrationDate} />
            <InfoLine label="건축물 용도" value={listing.buildingUse} />
          </div>
        </DetailSection>

        {/* 설명입니다. */}
        <DetailSection title="매물 설명">
          <p className="text-sm leading-7 text-slate-600">
            {listing.description || "등록된 매물 설명이 없습니다."}
          </p>
        </DetailSection>
      </div>
    </aside>
  );
}

type InfoItemProps = {
  label: string;
  value?: string | number | null;
};

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value || "-"}</p>
    </div>
  );
}

type InfoLineProps = {
  label: string;
  value?: string | number | null;
};

function InfoLine({ label, value }: InfoLineProps) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700">{value || "-"}</span>
    </div>
  );
}

type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
};

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="mt-7">
      <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </section>
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
          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
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

function formatArea(area?: number | null) {
  if (area === null || area === undefined) {
    return "-";
  }

  return `${area}㎡`;
}