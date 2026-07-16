type StepBarProps = {
  currentStep?: number;
};

const STEPS = [
  { label: '내 조건 진단' },
  { label: '제도 추천' },
  { label: '대출 계산' },
  { label: '집·공고 확인' },
  { label: '계약' },
];

export const StepBar = ({ currentStep = 1 }: StepBarProps) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-5 py-4">
        <div className="flex items-center justify-center">
          {STEPS.map((step, i) => {
            const active = currentStep === i + 1;

            return (
              <div key={step.label} className="flex items-center">
                {/* 스텝 아이템 */}
                <div className="flex flex-col items-center gap-1.5">
                  {/* 원형 아이콘 */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {/* 체크 아이콘 */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-2.5 w-2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* 텍스트 */}
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                      Step {i + 1}
                    </span>
                    <span
                      className={`text-xs ${
                        active ? 'font-bold text-gray-900' : 'font-normal text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>

                {/* 연결선 */}
                {i < STEPS.length - 1 && (
                  <div className="mx-2 mb-6 h-[2px] w-12 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
