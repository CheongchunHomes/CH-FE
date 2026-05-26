"use client";

import type { SubscriptionApplyDraft } from "@/app/site/subscription/[id]/apply/page";

type Props = {
  draft: SubscriptionApplyDraft;
  isSubmitting?: boolean;
  onPrev: () => void;
  onSubmit: () => void;
};

export default function SubscriptionApplyConfirmStep({
  draft,
  isSubmitting = false,
  onPrev,
  onSubmit,
}: Props) {
  const phone = `${draft.phonePrefix}-${draft.phoneMiddle}-${draft.phoneLast}`;
  const fullAddress = `${draft.address} ${draft.detailAddress}`.trim();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">청약 신청 내역 확인</h2>
      <p className="mt-2 text-sm text-gray-600">
        입력한 신청 정보를 확인한 뒤 신청을 완료해 주세요.
      </p>

      <div className="mt-6 rounded-xl border">
        <ConfirmSection title="신청 공고 정보">
          <ConfirmRow label="공고명" value={draft.announcementTitle} />
          <ConfirmRow label="주택형" value={draft.houseTypeName} />
          <ConfirmRow label="공고번호" value={String(draft.announcementId)} />
        </ConfirmSection>

        <ConfirmSection title="신청자 정보">
          <ConfirmRow label="신청자명" value={draft.applicantName} />
          <ConfirmRow label="연락처" value={phone} />
          <ConfirmRow label="주소" value={fullAddress} />
        </ConfirmSection>

        <ConfirmSection title="동의 내역">
          <ConfirmRow
            label="유의사항 확인"
            value={draft.noticeAgree ? "동의함" : "미동의"}
          />
          <ConfirmRow
            label="개인정보 수집 및 이용"
            value={draft.privacyAgree ? "동의함" : "미동의"}
          />
          <ConfirmRow
            label="제3자 제공"
            value={draft.thirdPartyAgree ? "동의함" : "미동의"}
          />
          <ConfirmRow
            label="고유식별정보"
            value={draft.uniqueInfoAgree ? "동의함" : "미동의"}
          />
        </ConfirmSection>
      </div>

      <div className="mt-6 rounded-xl bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-800">
        본 신청은 실제 청약이 아닌 프로젝트용 가상 신청 체험입니다. 실제
        청약은 반드시 청약홈 또는 해당 기관 공식 절차를 통해 진행해야 합니다.
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="rounded-xl bg-gray-600 px-12 py-3 text-base font-bold text-white hover:bg-gray-700"
        >
          ← 이전
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-blue-600 px-12 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "신청 중..." : "신청 완료하기"}
        </button>
      </div>
    </div>
  );
}

function ConfirmSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b last:border-b-0">
      <div className="bg-gray-50 px-5 py-3">
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 border-t md:grid-cols-[180px_1fr]">
      <div className="bg-gray-50 px-5 py-3 text-sm font-bold text-gray-700">
        {label}
      </div>
      <div className="px-5 py-3 text-sm text-gray-900">{value || "-"}</div>
    </div>
  );
}
