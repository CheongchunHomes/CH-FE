"use client";

import type { SubscriptionApplyDraft } from "@/app/site/subscription/[id]/apply/page";

type Props = {
  draft: SubscriptionApplyDraft;
  onMain: () => void;
};

export default function SubscriptionApplyCompleteStep({
  draft,
  onMain,
}: Props) {
  return (
    <div>
      <div className="rounded-2xl bg-blue-50 px-8 py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          청약신청이 완료되었습니다.
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          실제 청약이 아닌 프로젝트용 가상 체험입니다. 유의하십시오.
        </p>
      </div>

      <div className="mt-8 rounded-xl border">
        <div className="bg-gray-50 px-5 py-3">
          <h3 className="font-bold text-gray-900">신청 완료 내역</h3>
        </div>

        <CompleteRow label="공고명" value={draft.announcementTitle} />
        <CompleteRow label="주택형" value={draft.houseTypeName} />
        <CompleteRow label="신청자" value={draft.applicantName} />
        <CompleteRow
          label="연락처"
          value={`${draft.phonePrefix}-${draft.phoneMiddle}-${draft.phoneLast}`}
        />
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onMain}
          className="rounded-xl bg-blue-600 px-12 py-3 text-base font-bold text-white hover:bg-blue-700"
        >
          메인페이지로
        </button>
      </div>
    </div>
  );
}

function CompleteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 border-t md:grid-cols-[180px_1fr]">
      <div className="bg-gray-50 px-5 py-3 text-sm font-bold text-gray-700">
        {label}
      </div>
      <div className="px-5 py-3 text-sm text-gray-900">{value || "-"}</div>
    </div>
  );
}
