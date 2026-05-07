// lib/diagnosisUtils.ts
// 자가진단 공통 타입 및 유틸 함수

export interface DiagnosisForm {
  birthDate: string;
  married: boolean;
  houseless: boolean;
  householdSep: boolean;
  disabilityYn: boolean;
  dependentCount: number;
  currentResidence: string;
  annualIncome: number;
  monthlyIncome: number;
  cashAsset: number;
  totalAsset: number;
  hasSubscription: boolean;
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

// enum/nullable 필드 빈 문자열 → null 변환
// BE enum 파싱 오류 방지용
export const sanitizeDiagnosisForm = (form: DiagnosisForm) => ({
  ...form,
  employmentStatus: form.employmentStatus || null,
  employmentPeriod: form.employmentPeriod || null,
  marriagePeriod:   form.marriagePeriod   || null,
  marriagePlan:     form.marriagePlan      ?? null,
  hasYoungChild:    form.hasYoungChild     ?? null,
  singleParent:     form.singleParent      ?? null,
});
