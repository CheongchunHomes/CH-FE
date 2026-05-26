"use client";

import { useRef } from "react";
import type { SubscriptionApplyDraft } from "@/app/site/subscription/[id]/apply/page";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  buildingName: string;
  apartment: "Y" | "N";
  bname: string;
};

type Props = {
  draft: SubscriptionApplyDraft;
  updateDraft: (partial: Partial<SubscriptionApplyDraft>) => void;
  onPrev: () => void;
  onNext: () => void;
};

const DAUM_POSTCODE_SCRIPT_ID = "daum-postcode-script";
const DAUM_POSTCODE_SCRIPT_SRC =
  "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export default function SubscriptionApplyFormStep({
  draft,
  updateDraft,
  onPrev,
  onNext,
}: Props) {
  const detailAddressRef = useRef<HTMLInputElement | null>(null);

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
      alert("주소검색 버튼을 눌러 주소를 입력해 주세요.");
      return;
    }

    onNext();
  };

  const loadDaumPostcodeScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.daum?.Postcode) {
        resolve();
        return;
      }

      const existingScript = document.getElementById(DAUM_POSTCODE_SCRIPT_ID);

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("주소 검색 스크립트 로드 실패")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.id = DAUM_POSTCODE_SCRIPT_ID;
      script.src = DAUM_POSTCODE_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("주소 검색 스크립트 로드 실패"));

      document.body.appendChild(script);
    });
  };

  const handleAddressSearch = async () => {
    try {
      await loadDaumPostcodeScript();

      if (!window.daum?.Postcode) {
        alert("주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          const baseAddress =
            data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

          let extraAddress = "";

          if (data.userSelectedType === "R") {
            if (data.bname) {
              extraAddress += data.bname;
            }

            if (data.buildingName && data.apartment === "Y") {
              extraAddress += extraAddress
                ? `, ${data.buildingName}`
                : data.buildingName;
            }
          }

          updateDraft({
            zipCode: data.zonecode,
            address: extraAddress ? `${baseAddress} (${extraAddress})` : baseAddress,
            detailAddress: "",
          });

          window.setTimeout(() => {
            detailAddressRef.current?.focus();
          }, 0);
        },
      }).open();
    } catch (error) {
      console.error("주소 검색 실행 실패:", error);
      alert("주소 검색을 실행하지 못했습니다. 네트워크 상태를 확인해 주세요.");
    }
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
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={draft.phonePrefix}
              onChange={(event) =>
                updateDraft({
                  phonePrefix: event.target.value.replace(/[^0-9]/g, ""),
                })
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
          </div>
        </FormRow>

        <FormRow label="주소" required>
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={draft.zipCode}
                readOnly
                placeholder="우편번호"
                className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none sm:w-40"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="w-full rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:w-40"
              >
                주소검색
              </button>
            </div>

            <input
              value={draft.address}
              readOnly
              placeholder="주소검색 버튼을 눌러 기본 주소를 입력해 주세요"
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none"
            />

            <input
              ref={detailAddressRef}
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
          className="rounded-xl bg-blue-600 px-12 py-3 text-base font-bold text-white hover:bg-blue-700"
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
