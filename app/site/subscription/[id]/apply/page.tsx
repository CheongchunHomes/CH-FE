"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SubscriptionApplyStepper from "@/components/subscription/apply/SubscriptionApplyStepper";
import SubscriptionApplyNoticeStep from "@/components/subscription/apply/SubscriptionApplyNoticeStep";
import SubscriptionApplyFormStep from "@/components/subscription/apply/SubscriptionApplyFormStep";
import SubscriptionApplyConfirmStep from "@/components/subscription/apply/SubscriptionApplyConfirmStep";
import SubscriptionApplyCompleteStep from "@/components/subscription/apply/SubscriptionApplyCompleteStep"

type ApplyStep = 1 | 2 | 3 | 4;

export type SubscriptionApplyDraft = {
  announcementId: number;
  announcementTitle: string;
  houseTypeId: number | null;
  houseTypeName: string;
  applyType: string;

  applicantName: string;
  phonePrefix: string;
  phoneMiddle: string;
  phoneLast: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  smsAgree: boolean;

  noticeAgree: boolean;
  privacyAgree: boolean;
  thirdPartyAgree: boolean;
  uniqueInfoAgree: boolean;
};

const applyTypeLabelMap: Record<string, string> = {
  SPECIAL: "특별공급",
  FIRST: "1순위",
  SECOND: "2순위",
  REMAIN: "잔여세대",
};

export default function SubscriptionApplyPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<ApplyStep>(1);

  const announcementId = Number(params.id);
  const announcementTitle = searchParams.get("title") ?? "청약 공고";
  const houseTypeId = searchParams.get("houseTypeId")
    ? Number(searchParams.get("houseTypeId"))
    : null;
  const houseTypeName = searchParams.get("houseTypeName") ?? "-";
  const applyType = searchParams.get("applyType") ?? "";

  const [draft, setDraft] = useState<SubscriptionApplyDraft>({
    announcementId,
    announcementTitle,
    houseTypeId,
    houseTypeName,
    applyType,

    applicantName: "",
    phonePrefix: "010",
    phoneMiddle: "",
    phoneLast: "",
    zipCode: "",
    address: "",
    detailAddress: "",
    smsAgree: true,

    noticeAgree: false,
    privacyAgree: false,
    thirdPartyAgree: false,
    uniqueInfoAgree: false,
  });

  useEffect(() => {
    if (!announcementId || !houseTypeId || !applyType) {
      alert("신청에 필요한 공고, 주택형, 신청 타입 정보가 없습니다.");
      router.replace(`/site/subscription/${params.id}`);
    }
  }, [announcementId, houseTypeId, applyType, params.id, router]);

  const applyTypeLabel = useMemo(() => {
    return applyTypeLabelMap[draft.applyType] ?? draft.applyType;
  }, [draft.applyType]);

  const updateDraft = (partial: Partial<SubscriptionApplyDraft>) => {
    setDraft((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const goNext = () => {
    setStep((prev) => Math.min(prev + 1, 4) as ApplyStep);
  };

  const goPrev = () => {
    setStep((prev) => Math.max(prev - 1, 1) as ApplyStep);
  };

  const submitApplication = () => {
    const payload = {
      announcementId: draft.announcementId,
      houseTypeId: draft.houseTypeId,
      applyType: draft.applyType,
      applicantName: draft.applicantName,
      phone: `${draft.phonePrefix}-${draft.phoneMiddle}-${draft.phoneLast}`,
      zipCode: draft.zipCode,
      address: draft.address,
      detailAddress: draft.detailAddress,
      smsAgree: draft.smsAgree,
      noticeAgree: draft.noticeAgree,
      privacyAgree: draft.privacyAgree,
      thirdPartyAgree: draft.thirdPartyAgree,
      uniqueInfoAgree: draft.uniqueInfoAgree,
    };

    // TODO: 백엔드 신청 API 생성 후 POST 요청으로 교체
    // 예시: await post("/api/subscription/applications", payload);
    console.log("[청약 신청 최종 payload]", payload);

    setStep(4);

  };

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">청춘홈즈 청약 체험</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              공고단지 청약신청
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/site/subscription/${params.id}`)}
            className="rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            상세페이지로 돌아가기
          </button>
        </div>

        <section className="mb-8 rounded-2xl border bg-yellow-50 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SummaryItem label="공고명" value={draft.announcementTitle} />
            <SummaryItem label="주택형" value={draft.houseTypeName} />
            <SummaryItem label="공급유형" value={applyTypeLabel} />
            <SummaryItem
              label="신청구분"
              value="가상 청약 신청"
              strong
            />
          </div>
        </section>

        <SubscriptionApplyStepper currentStep={step} />

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          {step === 1 && (
            <SubscriptionApplyNoticeStep
              draft={draft}
              updateDraft={updateDraft}
              onNext={goNext}
            />
          )}

          {step === 2 && (
            <SubscriptionApplyFormStep
              draft={draft}
              updateDraft={updateDraft}
              onPrev={goPrev}
              onNext={goNext}
            />
          )}

          {step === 3 && (
            <SubscriptionApplyConfirmStep
              draft={draft}
              applyTypeLabel={applyTypeLabel}
              onPrev={goPrev}
              onSubmit={submitApplication}
            />
          )}

          {step === 4 && (
            <SubscriptionApplyCompleteStep
              draft={draft}
              applyTypeLabel={applyTypeLabel}
              onHome={() => router.push("/site/subscription")}
              onDetail={() => router.push(`/site/subscription/${params.id}`)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p
        className={`mt-1 line-clamp-2 text-sm ${
          strong ? "font-bold text-blue-700" : "font-bold text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}