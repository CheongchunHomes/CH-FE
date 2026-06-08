// lib/diagnosisUtils.ts
// 자가진단 공통 타입 및 유틸 함수

export interface DiagnosisForm {
  birthDate: string;
  married: boolean | null;
  houseless: boolean | null;
  householdSep: boolean | null;
  disabilityYn: boolean;
  dependentCount: number;
  currentResidence: string;
  annualIncome: number;
  monthlyIncome: number;
  cashAsset: number;
  totalAsset: number;
  hasSubscription: boolean | null;
  subscriptionMonths: number;
  desiredCity: string;
  desiredDistrict: string;
  desiredArea: number;
  desiredType: string;
  employmentStatus: string;
  employmentPeriod: string;
  marriagePlan: boolean;
  marriagePeriod: string;
  hasYoungChild: boolean;
  singleParent: boolean;
  houselessYears: number;
}

export interface DiagnosisResult {
  houselessStatus: string;
  ageStatus: string;
  incomeStatus: string;
  assetStatus: string;
  subscriptionStatus: string;
  dependentStatus: string;
  subscriptionScore: number;
  publicRentalScore: number;
  jeonseScore: number;
  saleScore: number;
  strengthComment: string;
  weaknessComment: string;
  improveComment: string;
  recommendComment: string;
}

export interface PolicyResult {
  policyName: string;
  recoId: number | null;
  score: number;
  grade: string;
  reason: string;
  description: string | null;
  applyUrl: string | null;
}

export interface RecommendationResponse {
  results: PolicyResult[];
}

// enum/nullable 필드 빈 문자열 → null 변환, monthlyIncome 백엔드 전송 제외
// BE enum 파싱 오류 방지용
export const sanitizeDiagnosisForm = (form: DiagnosisForm) => {
  const { monthlyIncome: _monthlyIncome, ...rest } = form;
  void _monthlyIncome;
  return {
    ...rest,
    married:          form.married          ?? null,
    houseless:        form.houseless        ?? null,
    householdSep:     form.householdSep     ?? null,
    hasSubscription:  form.hasSubscription  ?? null,
    employmentStatus: form.employmentStatus || null,
    employmentPeriod: form.employmentPeriod || null,
    marriagePeriod:   form.marriagePeriod   || null,
    marriagePlan:     form.marriagePlan      ?? null,
    hasYoungChild:    form.hasYoungChild     ?? null,
    singleParent:     form.singleParent      ?? null,
  };
};

// 만원 단위 기준 (DB값은 / 10000 변환 후 사용)
export const formatAsset = (value: number): string => {
  if (!value || value <= 0) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억`;
  return `${man.toLocaleString()}만원`;
};
