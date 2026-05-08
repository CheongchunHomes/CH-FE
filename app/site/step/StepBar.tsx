// active: true 인 스텝이 현재 활성 스텝
// 각 페이지에서 해당 스텝만 active: true 로 바꿔서 사용

const STEPS = [
  { label: 'step1. 내 조건 진단', active: false },
  { label: 'step2. 제도 추천', active: true },
  { label: 'step3. 대출 계산', active: false },
  { label: 'step4. 집·공고 확인', active: false },
  { label: 'step5. 계약', active: false },
];

<div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-4">
          <div className="flex items-center justify-center">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                {/* 스텝 아이템 */}
                <div className="flex flex-col items-center gap-1.5">
                  {/* 원형 아이콘 */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      step.active
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
                    <span className={`text-[10px] ${step.active ? 'text-blue-600' : 'text-gray-400'}`}>
                      Step {i + 1}
                    </span>
                    <span
                      className={`text-xs ${
                        step.active ? 'font-bold text-gray-900' : 'font-normal text-gray-400'
                      }`}
                    >
                      {step.label.replace(/step\d+\. /i, '')}
                    </span>
                  </div>
                </div>

                {/* 연결선 */}
                {i < STEPS.length - 1 && (
                  <div className="mx-2 mb-6 h-[2px] w-12 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>