"use client";

import type { SubscriptionApplyDraft } from "@/app/site/subscription/[id]/apply/page";

type Props = {
  draft: SubscriptionApplyDraft;
  updateDraft: (partial: Partial<SubscriptionApplyDraft>) => void;
  onNext: () => void;
};

export default function SubscriptionApplyNoticeStep({
  draft,
  updateDraft,
  onNext,
}: Props) {
  const allChecked =
    draft.noticeAgree &&
    draft.privacyAgree &&
    draft.thirdPartyAgree &&
    draft.uniqueInfoAgree;

  const toggleAll = (checked: boolean) => {
    updateDraft({
      noticeAgree: checked,
      privacyAgree: checked,
      thirdPartyAgree: checked,
      uniqueInfoAgree: checked,
    });
  };

  const validateAndNext = () => {
    if (!allChecked) {
      alert("필수 유의사항 및 동의 항목을 모두 확인해 주세요.");
      return;
    }

    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">청약신청 유의사항</h2>
      <p className="mt-2 text-sm text-gray-600">
        신청 전 유의사항과 개인정보 수집·이용 동의 항목을 확인해 주세요.
        본 화면은 실제 청약이 아닌 프로젝트용 가상 신청 체험입니다.
      </p>

      <div className="mt-6 rounded-xl border bg-gray-50 p-5">
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">전체 동의하기</p>
            <p className="mt-1 text-sm text-gray-500">
              아래 필수 항목을 모두 확인하고 동의합니다.
            </p>
          </div>

          <input
            type="checkbox"
            checked={allChecked}
            onChange={(event) => toggleAll(event.target.checked)}
            className="h-5 w-5"
          />
        </label>
      </div>

      <div className="mt-5 space-y-4">
        <AgreementBox
          title="[필수] 청약신청 유의사항 확인"
          checked={draft.noticeAgree}
          onChange={(checked) => updateDraft({ noticeAgree: checked })}
        >
          <p>
            청약 신청은 본인이 선택한 공고, 주택형, 공급유형을 기준으로
            접수됩니다. 허위 신청, 중복 신청, 자격 미달 신청 시 불이익이
            발생할 수 있습니다.
          </p>
          <p className="mt-2">
            실제 청약 신청은 반드시 청약홈 또는 해당 기관의 공식 안내를 통해
            진행해야 합니다.
          </p>
        </AgreementBox>

        <AgreementBox
          title="[필수] 개인정보 수집 및 이용 동의"
          checked={draft.privacyAgree}
          onChange={(checked) => updateDraft({ privacyAgree: checked })}
        >
          <p>
            신청자 확인, 신청 내역 관리, 신청 결과 안내를 위해 이름, 연락처,
            주소 정보를 수집할 수 있습니다.
          </p>
        </AgreementBox>

        <AgreementBox
          title="[필수] 개인정보 제3자 제공 동의"
          checked={draft.thirdPartyAgree}
          onChange={(checked) => updateDraft({ thirdPartyAgree: checked })}
        >
          <p>
            신청 자격 확인 및 공급 관련 안내를 위해 필요한 범위 내에서 관련
            기관에 신청 정보를 제공할 수 있습니다.
          </p>
        </AgreementBox>

        <AgreementBox
          title="[필수] 고유식별정보 수집 및 이용 동의"
          checked={draft.uniqueInfoAgree}
          onChange={(checked) => updateDraft({ uniqueInfoAgree: checked })}
        >
          <p>
            본 프로젝트에서는 실제 주민등록번호를 입력받지 않습니다. 실제
            청약에서는 자격 확인을 위해 고유식별정보가 활용될 수 있습니다.
          </p>
        </AgreementBox>
      </div>

      <div className="mt-8 flex justify-end">
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

function AgreementBox({
  title,
  checked,
  onChange,
  children,
}: {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-3">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4"
          />
          동의함
        </label>
      </div>

      <div className="max-h-48 overflow-y-auto px-5 py-4 text-sm leading-6 text-gray-700">
        {children}
      </div>
    </div>
  );
}