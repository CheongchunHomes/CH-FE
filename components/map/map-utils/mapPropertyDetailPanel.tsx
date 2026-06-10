"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MapListing } from "@/lib/map/map-types";
import { getMapPropertyThumbnailImageUrl } from "@/lib/map/map-image";
import { createSign } from "@/lib/sign-api";

type MapPropertyDetailPanelProps = {
  listing: MapListing | null;
  onClose: () => void;
  onOpenChat?: (listing: MapListing) => void;
  isOpeningChat?: boolean;
};

type ContractFeedback = {
  title: string;
  message: string;
  tone: "success" | "error";
};

export default function MapPropertyDetailPanel({
  listing,
  onClose,
  onOpenChat,
  isOpeningChat = false,
}: MapPropertyDetailPanelProps) {
  const router = useRouter();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isContractRequesting, setIsContractRequesting] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [contractFeedback, setContractFeedback] =
    useState<ContractFeedback | null>(null);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [listing?.id, listing?.thumbnailUrl]);

  if (!listing) {
    return null;
  }

  const isSubscriptionListing = listing.category === "subscription";
  const tags = Array.isArray(listing.tag) ? listing.tag : [];
  const options = Array.isArray(listing.options) ? listing.options : [];
  const securityFacilities = Array.isArray(listing.securityFacilities)
    ? listing.securityFacilities
    : [];
  const thumbnailUrl = getMapPropertyThumbnailImageUrl(listing.id);
  const imageUrl = imageLoadFailed ? null : thumbnailUrl;

  const handleConfirmContractRequest = async () => {
    try {
      setIsContractRequesting(true);

      await createSign(listing.id);

      setIsContractModalOpen(false);
      setContractFeedback({
        title: "계약 요청 완료",
        message:
          "임대인에게 계약 요청을 보냈습니다. 마이페이지에서 진행 상태를 확인해 주세요.",
        tone: "success",
      });
    } catch (error) {
      console.error("계약 요청 실패:", error);
      setContractFeedback({
        title: "계약 요청 실패",
        message: "계약 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
        tone: "error",
      });
    } finally {
      setIsContractRequesting(false);
    }
  };

  return (
    <>
      <aside className="h-full w-[430px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white shadow-sm">
        {/* 상세 패널 상단입니다. */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-blue-600">
              {getCategoryLabel(listing.category)}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {isSubscriptionListing ? `공고 ${listing.id}` : `매물 ${listing.id}`}
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
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              onError={() => setImageLoadFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
              {isSubscriptionListing ? "공고 이미지 준비중" : "이미지 준비중"}
            </div>
          )}
        </div>

        <div className="p-5">
          {/* 매물 제목과 가격입니다. */}
          <div>
            <p className="text-xs font-semibold text-slate-400">
              {isSubscriptionListing ? "공고번호" : "매물번호"} {listing.id}
            </p>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              {isSubscriptionListing ? listing.title : listing.depositLabel}
              {!isSubscriptionListing && listing.monthlyRentLabel ? ` / ${listing.monthlyRentLabel}` : ""}
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
            <InfoItem
              label="전용면적"
              value={formatArea(listing.exclusiveAreaM2)}
            />
            <InfoItem
              label="층수"
              value={`${listing.floor ?? "-"}층 / ${
                listing.totalFloor ?? "-"
              }층`}
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
          {isSubscriptionListing ? (
            <button
              type="button"
              onClick={() => router.push(`/site/subscription/${listing.id}`)}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              청약 신청하기
            </button>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsContractModalOpen(true)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100"
              >
                계약 요청하기
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
          )}

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
              <InfoLine
                label="최초등록일"
                value={listing.firstRegistrationDate}
              />
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

      {!isSubscriptionListing && isContractModalOpen && (
        <ContractRequestModal
          listing={listing}
          isLoading={isContractRequesting}
          onClose={() => setIsContractModalOpen(false)}
          onConfirm={handleConfirmContractRequest}
        />
      )}

      {contractFeedback && (
        <ContractFeedbackModal
          feedback={contractFeedback}
          onClose={() => setContractFeedback(null)}
        />
      )}
    </>
  );
}

type ContractRequestModalProps = {
  listing: MapListing;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function ContractRequestModal({
  listing,
  isLoading,
  onClose,
  onConfirm,
}: ContractRequestModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          계약 요청 전 확인
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          아래 매물 정보를 마지막으로 확인해주세요. 확인 버튼을 누르면 해당
          매물에 대한 계약 요청이 진행됩니다.
        </p>

        <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <InfoLine label="매물번호" value={listing.id} />
          <InfoLine label="계약유형" value="주택계약" />
          <InfoLine label="주소" value={listing.address} />
          <InfoLine
            label="보증금/월세"
            value={`${listing.depositLabel}${
              listing.monthlyRentLabel ? ` / ${listing.monthlyRentLabel}` : ""
            }`}
          />
          <InfoLine
            label="관리비"
            value={
              listing.maintenanceFee !== null &&
              listing.maintenanceFee !== undefined
                ? `${listing.maintenanceFee}만 원`
                : "-"
            }
          />
          <InfoLine label="방종류" value={listing.roomType} />
          <InfoLine label="전용면적" value={formatArea(listing.exclusiveAreaM2)} />
          <InfoLine
            label="층수"
            value={`${listing.floor ?? "-"}층 / ${
              listing.totalFloor ?? "-"
            }층`}
          />
          <InfoLine
            label="방/욕실"
            value={`${listing.roomCount ?? "-"}개 / ${
              listing.bathroomCount ?? "-"
            }개`}
          />
          <InfoLine label="방향" value={listing.direction} />
          <InfoLine label="난방" value={listing.heatingType} />
          <InfoLine
            label="주차"
            value={
              listing.totalParkingCount !== null &&
              listing.totalParkingCount !== undefined
                ? `${listing.totalParkingCount}대`
                : "-"
            }
          />
          <InfoLine label="입주 유형" value={listing.moveInType} />
          <InfoLine label="입주 가능일" value={listing.moveInDate} />
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          확인 버튼을 누르면 임대인에게 계약 요청이 전달됩니다. 실제 계약
          진행은 임대인 확인 후 별도 절차로 진행됩니다.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "요청 중..." : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ContractFeedbackModalProps = {
  feedback: ContractFeedback;
  onClose: () => void;
};

function ContractFeedbackModal({
  feedback,
  onClose,
}: ContractFeedbackModalProps) {
  const isSuccess = feedback.tone === "success";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 text-center shadow-xl">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
            isSuccess
              ? "bg-blue-50 text-blue-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {isSuccess ? "✓" : "!"}
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          {feedback.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {feedback.message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          확인
        </button>
      </div>
    </div>
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
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-700">
        {value || "-"}
      </span>
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
