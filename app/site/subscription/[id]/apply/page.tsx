"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SubscriptionApplyStepper from "@/components/subscription/apply/SubscriptionApplyStepper";
import SubscriptionApplyNoticeStep from "@/components/subscription/apply/SubscriptionApplyNoticeStep";
import SubscriptionApplyFormStep from "@/components/subscription/apply/SubscriptionApplyFormStep";
import SubscriptionApplyConfirmStep from "@/components/subscription/apply/SubscriptionApplyConfirmStep";
import SubscriptionApplyCompleteStep from "@/components/subscription/apply/SubscriptionApplyCompleteStep";
import { ApiError } from "@/lib/api";
import { applySubscription } from "@/lib/subscription-api";

type ApplyStep = 1 | 2 | 3 | 4;

export type SubscriptionApplyDraft = {
  announcementId: number;
  announcementTitle: string;
  houseTypeId: number | null;
  houseTypeName: string;

  applicantName: string;
  phonePrefix: string;
  phoneMiddle: string;
  phoneLast: string;
  zipCode: string;
  address: string;
  detailAddress: string;

  noticeAgree: boolean;
  privacyAgree: boolean;
  thirdPartyAgree: boolean;
  uniqueInfoAgree: boolean;
};

export default function SubscriptionApplyPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <SubscriptionApplyContent />
    </Suspense>
  );
}

function SubscriptionApplyContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<ApplyStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const announcementId = Number(params.id);
  const announcementTitle = searchParams.get("title") ?? "청약 공고";
  const houseTypeId = searchParams.get("houseTypeId")
    ? Number(searchParams.get("houseTypeId"))
    : null;
  const houseTypeName = searchParams.get("houseTypeName") ?? "";

  const [draft, setDraft] = useState<SubscriptionApplyDraft>({
    announcementId,
    announcementTitle,
    houseTypeId,
    houseTypeName,

    applicantName: "",
    phonePrefix: "010",
    phoneMiddle: "",
    phoneLast: "",
    zipCode: "",
    address: "",
    detailAddress: "",

    noticeAgree: false,
    privacyAgree: false,
    thirdPartyAgree: false,
    uniqueInfoAgree: false,
  });

  useEffect(() => {
    if (!announcementId || !houseTypeName) {
      alert("신청에 필요한 공고, 주택형 정보가 없습니다.");
      router.replace(`/site/subscription/${params.id}`);
    }
  }, [announcementId, houseTypeName, params.id, router]);

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

  const submitApplication = async () => {
    const payload = {
      announcementId: draft.announcementId,
      supplyId: draft.houseTypeId,
      housingType: draft.houseTypeName,
      applicantName: draft.applicantName,
      postalCode: draft.zipCode,
      address: draft.address,
      detailAddress: draft.detailAddress,
    };

    console.log("[청약 신청 최종 payload]", payload);

    try {
      setIsSubmitting(true);
      await applySubscription(payload);
      alert("청약 신청이 완료되었습니다.");
      setStep(4);
    } catch (error) {
      console.error("청약 신청 실패:", error);

      if (isDuplicateApplicationError(error)) {
        alert("이미 신청한 공고입니다.");
        return;
      }

      alert("청약 신청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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

        <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryItem label="공고명" value={draft.announcementTitle} />
            <SummaryItem label="주택형" value={draft.houseTypeName} />
            <SummaryItem label="신청구분" value="가상 청약 신청" strong />
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
              isSubmitting={isSubmitting}
              onPrev={goPrev}
              onSubmit={submitApplication}
            />
          )}

          {step === 4 && (
            <SubscriptionApplyCompleteStep
              draft={draft}
              onMain={() => router.push("/site")}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function isDuplicateApplicationError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.status === 409 ||
    message.includes("이미") ||
    message.includes("중복") ||
    message.includes("duplicate") ||
    message.includes("already")
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
