"use client";

type ApplyStep = 1 | 2 | 3 | 4;

const steps = [
  {
    step: 1,
    label: "유의사항 및 동의",
  },
  {
    step: 2,
    label: "신청자 정보 입력",
  },
  {
    step: 3,
    label: "신청 내역 확인",
  },
  {
    step: 4,
    label: "신청 완료",
  },
];

export default function SubscriptionApplyStepper({
  currentStep,
}: {
  currentStep: ApplyStep;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="grid grid-cols-4">
        {steps.map((item, index) => {
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;

          return (
            <div key={item.step} className="relative flex flex-col items-center">
              {index !== 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-1 w-full ${
                    isDone || isActive ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isDone
                    ? "bg-blue-600 text-white"
                    : isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? "✓" : item.step}
              </div>

              <p
                className={`mt-3 text-center text-xs font-semibold md:text-sm ${
                  isActive ? "text-blue-700" : "text-gray-600"
                }`}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
