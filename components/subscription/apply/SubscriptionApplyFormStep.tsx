"use client";

import type { SubscriptionApplyDraft } from "@/app/site/subscription/[id]/apply/page";

type Props = {
  draft: SubscriptionApplyDraft;
  updateDraft: (partial: Partial<SubscriptionApplyDraft>) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function SubscriptionApplyFormStep({
  draft,
  updateDraft,
  onPrev,
  onNext,
}: Props) {
  const validateAndNext = () => {
    if (!draft.applicantName.trim()) {
      alert("신청자 이름을 입력해 주세요.");
      return;
    }

    if (!draft.phoneMiddle.trim() || !draft.phoneLast.trim()) {
      alert("연락처를 입력해 주세요.");
      return;
    }

    if (!draft.zipCode.trim() || !draft.address.trim()) {
      alert("주소를 입력해 주세요.");
      return;
    }

    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">신청자 정보 입력</h2>
      <p className="mt-2 text-sm text-gray-600">
        청약 신청 확인을 위해 필요한 기본 정보를 입력해 주세요.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border">
        <FormRow label="신청자명" required>
          <input
            value={draft.applicantName}
            onChange={(event) =>
              updateDraft({ applicantName: event.target.value })
            }
            placeholder="이름을 입력해 주세요"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </FormRow>

        <FormRow label="연락처" required>
          <div className="flex items-center gap-2">
            <input
              value={draft.phonePrefix}
              onChange={(event) =>
                updateDraft({ phonePrefix: event.target.value })
              }
              maxLength={3}
              className="w-20 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <span>-</span>
            <input
              value={draft.phoneMiddle}
              onChange={(event) =>
                updateDraft({
                  phoneMiddle: event.target.value.replace(/[^0-9]/g, ""),
                })
              }
              maxLength={4}
              className="w-28 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <span>-</span>
            <input
              value={draft.phoneLast}
              onChange={(event) =>
                updateDraft({
                  phoneLast: event.target.value.replace(/[^0-9]/g, ""),
                })
              }
              maxLength={4}
              className="w-28 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <label className="ml-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.smsAgree}
                onChange={(event) =>
                  updateDraft({ smsAgree: event.target.checked })
                }
              />
              SMS 통지에 동의함
            </label>
          </div>
        </FormRow>

        <FormRow label="주소" required>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={draft.zipCode}
                onChange={(event) => updateDraft({ zipCode: event.target.value })}
                placeholder="우편번호"
                className="w-36 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => alert("주소 검색 기능은 추후 연결 예정입니다.")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                주소검색
              </button>
            </div>

            <input
              value={draft.address}
              onChange={(event) => updateDraft({ address: event.target.value })}
              placeholder="기본 주소를 입력해 주세요"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <input
              value={draft.detailAddress}
              onChange={(event) =>
                updateDraft({ detailAddress: event.target.value })
              }
              placeholder="상세 주소를 입력해 주세요"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </FormRow>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl bg-gray-600 px-12 py-3 text-base font-bold text-white hover:bg-gray-700"
        >
          ← 이전
        </button>

        <button
          type="button"
          onClick={validateAndNext}
          className="rounded-xl bg-yellow-400 px-12 py-3 text-base font-bold text-gray-900 hover:bg-yellow-300"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

function FormRow({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 border-b last:border-b-0 md:grid-cols-[180px_1fr]">
      <div className="flex items-center bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}