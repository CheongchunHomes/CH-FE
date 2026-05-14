"use client";

import { post } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronDown, RotateCcw, ChevronUp, HelpCircle, Home, Users, BookOpen, Wallet, Heart, Building2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DiagnosisForm, sanitizeDiagnosisForm } from "@/lib/diagnosisUtils";
import { useAuth } from "@/lib/auth-context";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─────────────────────────────────────────────────────────
// 스텝 네비게이션
// ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "주거 형태" },
  { id: 2, label: "자산/소득" },
  { id: 3, label: "무주택 정보" },
  { id: 4, label: "기본 자격" },
  { id: 5, label: "청약 정보" },
  { id: 6, label: "가구 정보" },
  { id: 7, label: "희망 조건" },
];

// ─────────────────────────────────────────────────────────
// 도시별 지역구 데이터
// ─────────────────────────────────────────────────────────
const DISTRICT_MAP: Record<string, string[]> = {
  서울: ["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"],
  경기: ["수원시","성남시","의정부시","안양시","부천시","광명시","평택시","안산시","고양시","과천시","구리시","남양주시","오산시","시흥시","군포시","의왕시","하남시","용인시","파주시","이천시","안성시","김포시","화성시","광주시","양주시","포천시","여주시"],
  인천: ["중구","동구","미추홀구","연수구","남동구","부평구","계양구","서구","강화군","옹진군"],
  부산: ["중구","서구","동구","영도구","부산진구","동래구","남구","북구","해운대구","사하구","금정구","강서구","연제구","수영구","사상구","기장군"],
  대구: ["중구","동구","서구","남구","북구","수성구","달서구","달성군"],
  광주: ["동구","서구","남구","북구","광산구"],
  대전: ["동구","중구","서구","유성구","대덕구"],
  울산: ["중구","남구","동구","북구","울주군"],
  세종: ["세종시"],
  강원: ["춘천시","원주시","강릉시","동해시","태백시","속초시","삼척시","홍천군","횡성군","영월군","평창군","정선군","철원군","화천군","양구군","인제군","고성군","양양군"],
  충북: ["청주시","충주시","제천시","보은군","옥천군","영동군","증평군","진천군","괴산군","음성군","단양군"],
  충남: ["천안시","공주시","보령시","아산시","서산시","논산시","계룡시","당진시","금산군","부여군","서천군","청양군","홍성군","예산군","태안군"],
  전북: ["전주시","군산시","익산시","정읍시","남원시","김제시","완주군","진안군","무주군","장수군","임실군","순창군","고창군","부안군"],
  전남: ["목포시","여수시","순천시","나주시","광양시","담양군","곡성군","구례군","고흥군","보성군","화순군","장흥군","강진군","해남군","영암군","무안군","함평군","영광군","장성군","완도군","진도군","신안군"],
  경북: ["포항시","경주시","김천시","안동시","구미시","영주시","영천시","상주시","문경시","경산시","의성군","청송군","영양군","영덕군","청도군","고령군","성주군","칠곡군","예천군","봉화군","울진군"],
  경남: ["창원시","진주시","통영시","사천시","김해시","밀양시","거제시","양산시","의령군","함안군","창녕군","고성군","남해군","하동군","산청군","함양군","거창군","합천군"],
  제주: ["제주시","서귀포시"],
};

// 희망 주택 유형
const DESIRED_TYPE_OPTIONS = [
  "행복주택", "국민임대", "전세임대", "공공분양", "민간분양", "상관없음",
];

// ─────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────
const formatAsset = (value: number): string => {
  if (value <= 0) return "";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억`;
  return `${man.toLocaleString()}만원`;
};

// 평 → ㎡ (1평 = 3.3058㎡)
const pyeongToSqm = (pyeong: number): number => Math.round(pyeong * 3.3058);

// ㎡ → 평
const sqmToPyeong = (sqm: number): number => Math.round((sqm / 3.3058) * 10) / 10;


const INITIAL_FORM: DiagnosisForm = {
  birthDate: "",
  married: null,
  houseless: null,
  householdSep: null,
  disabilityYn: false,
  dependentCount: 0,
  currentResidence: "",
  annualIncome: 0,
  monthlyIncome: 0,
  cashAsset: 0,
  totalAsset: 0,
  hasSubscription: null,
  subscriptionMonths: 0,
  desiredCity: "",
  desiredDistrict: "",
  desiredArea: 0,
  desiredType: "",
  employmentStatus: "",
  employmentPeriod: "",
  marriagePlan: false,
  marriagePeriod: "",
  hasYoungChild: false,
  singleParent: false,
};

const isStepCompleted = (stepId: number, form: DiagnosisForm): boolean => {
  switch (stepId) {
    // Q1. 주거형태 - 선택 필수
    case 1:
      return form.currentResidence !== "";

    // Q2. 자산/소득 - 총자산 + 연소득 둘 다 필수
    case 2:
      return form.totalAsset > 0 && form.annualIncome > 0;

    // Q3. 무주택 - 무주택/유주택, 세대분리 여부 둘 다 명시적 선택 필수
    case 3:
      return form.houseless !== null && form.householdSep !== null;

    // Q4. 기본자격 - 생년월일 필수
    case 4:
      return form.birthDate !== "";

    // Q5. 청약정보 - 명시적 선택 필수, 있으면 개월수도 필수
    case 5:
      if (form.hasSubscription === null) return false;
      if (form.hasSubscription === true) return form.subscriptionMonths > 0;
      return true;

    // Q6. 가구정보 - 혼인여부 + 취업상태 필수, 조건부 추가 필수
    case 6: {
      if (form.married === null) return false;
      if (!form.employmentStatus) return false;
      if ((form.employmentStatus === "NEWCOMER" || form.employmentStatus === "EMPLOYED")
          && !form.employmentPeriod) return false;
      if (form.married === true && !form.marriagePeriod) return false;
      return true;
    }

    // Q7. 희망조건 - 도시 + 지역구 필수
    case 7:
      return form.desiredCity !== "" && form.desiredDistrict !== "";

    default:
      return false;
  }
};

// 진행률
const calculateProgress = (form: DiagnosisForm): number => {
  const completed = STEPS.filter((s) => isStepCompleted(s.id, form)).length;
  return Math.round((completed / STEPS.length) * 100);
};

// 취업·재직·혼인 기간 표시 라벨
const EMPLOYMENT_STATUS_LABEL: Record<string, string> = {
  STUDENT: "학생",
  JOB_SEEKER: "구직중",
  NEWCOMER: "사회초년생",
  EMPLOYED: "재직중",
  OTHER: "기타",
};

const EMPLOYMENT_PERIOD_LABEL: Record<string, string> = {
  UNDER_1: "1년 미만",
  YEAR_1_3: "1~3년",
  YEAR_3_5: "3~5년",
  OVER_5: "5년 이상",
};

const MARRIAGE_PERIOD_LABEL: Record<string, string> = {
  WITHIN_7: "7년 이내",
  OVER_7: "7년 초과",
};

// 선택확인란 데이터 - 입력된 값만
const getSummaryItems = (form: DiagnosisForm) => {
  const items = [
    { label: "주거 형태",   value: form.currentResidence },
    { label: "총 자산",     value: form.totalAsset > 0 ? `${formatAsset(form.totalAsset)} 이하` : "" },
    { label: "현금성 자산", value: form.cashAsset > 0 ? formatAsset(form.cashAsset) : "" },
    { label: "연소득",      value: form.annualIncome > 0 ? formatAsset(form.annualIncome) : "" },
    { label: "무주택", value: form.houseless === true ? "무주택" : form.houseless === false ? "유주택" : "" },
    { label: "세대 분리", value: form.householdSep === true ? "분리됨" : form.householdSep === false ? "미분리" : "" },
    { label: "생년월일",    value: form.birthDate },
    { label: "혼인 여부", value: form.married === true ? "기혼" : form.married === false ? "미혼" : "" },
    { label: "장애 여부",   value: form.disabilityYn ? "있음" : "" },
    { label: "부양가족",    value: form.dependentCount > 0 ? `${form.dependentCount}명` : "" },
    { label: "청약통장", value: form.hasSubscription === true ? `${form.subscriptionMonths}개월` : form.hasSubscription === false ? "없음" : "" },
    { label: "희망 도시",   value: form.desiredCity },
    { label: "희망 지역구", value: form.desiredDistrict },
    {label: "희망 면적",    value: form.desiredArea > 0 ? `${form.desiredArea}㎡ (약 ${sqmToPyeong(form.desiredArea)}평)` : "",},
    { label: "취업 상태",   value: EMPLOYMENT_STATUS_LABEL[form.employmentStatus] ?? "" },
    { label: "재직 기간",   value: EMPLOYMENT_PERIOD_LABEL[form.employmentPeriod] ?? "" },
    { label: "결혼 계획",   value: form.marriagePlan ? "있음" : "" },
    { label: "혼인 기간",   value: MARRIAGE_PERIOD_LABEL[form.marriagePeriod] ?? "" },
    { label: "영유아 자녀", value: form.hasYoungChild ? "있음" : "" },
    { label: "한부모 가족", value: form.singleParent ? "해당" : "" },
    { label: "희망 유형",   value: form.desiredType },
  ];
  
  return items.filter((item) => item.value !== "");
};


// ─────────────────────────────────────────────────────────
// 공통 컴포넌트
// ─────────────────────────────────────────────────────────
const RadioCard = ({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) => (
  <label className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border cursor-pointer transition-colors" onClick={onClick}>
    <span className="text-sm">{label}</span>
    <input type="radio" className="w-5 h-5 accent-blue-600" checked={checked} onChange={() => {}} />
  </label>
);

const QuestionHeader = ({ num, title, completed }: { num: number; title: string; completed: boolean }) => (
  <div className="flex items-center gap-3 border-b pb-2">
    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 shrink-0">
      {completed
        ? <Check className="w-3 h-3 text-blue-600 stroke-[3]" />
        : <span className="text-blue-700 text-xs font-bold">{num}</span>
      }
    </span>
    <h2 className="text-base md:text-lg font-bold">{title}</h2>
  </div>
);

// ─────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────
const HousingFormPage = () => {
  const router = useRouter();
  const { status } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<DiagnosisForm>(INITIAL_FORM);
  const [navOpen, setNavOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pyeongInput, setPyeongInput] = useState(""); // 평수 입력 임시 상태
  const [validationError, setValidationError] = useState("");

  // form 바뀔 때마다 저장
  const update = <K extends keyof DiagnosisForm>(key: K, val: DiagnosisForm[K]) =>
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      sessionStorage.setItem("diagnosisFormTemp", JSON.stringify(next));
      return next;
    });
// 네비 클릭 스크롤 중 observer 무시용 플래그
  const isScrollingRef = useRef(false);

// form 임시저장 복원 (뒤로가기 대응)
  useEffect(() => {
    const saved = sessionStorage.getItem("diagnosisForm");

    if (!saved) return;

    try {
      setForm(JSON.parse(saved));
    } catch {
      setForm(INITIAL_FORM);
    }
  }, []);

  // 스크롤 위치 기반 현재 스텝 업데이트
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return; // 클릭 스크롤 중이면 무시
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.id.replace("q", ""));
            setCurrentStep(id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", // 화면 상단 20% 지점에서 감지
        threshold: 0, }
    );

    STEPS.forEach((s) => {
      const el = document.getElementById(`q${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // 스크롤 함수: 클릭 시 플래그 켜고 이동 완료 후 꺼짐
  const scrollToQuestion = (stepId: number) => {
    const target = document.getElementById(`q${stepId}`);
    if (target) {
      isScrollingRef.current = true;
      setCurrentStep(stepId);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    }
  };

  const dataProgress = calculateProgress(form);
  const summaryItems = getSummaryItems(form);

  // 도시 변경 시 지역구 초기화
  const handleCityChange = (city: string) => {
    setForm((prev) => ({ ...prev, desiredCity: city, desiredDistrict: "" }));
  };

  // 다시 진단하기 - sessionStorage 초기화 후 폼 리셋
  const handleReset = () => {
    sessionStorage.removeItem("diagnosisForm");
    sessionStorage.removeItem("diagnosisFormTemp");
    sessionStorage.removeItem("diagnosisResult");
    sessionStorage.removeItem("recommendationResult");
    setForm(INITIAL_FORM);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async () => {
    // 모든 스텝 완료 여부 체크
    const incompleteSteps = STEPS.filter(s => !isStepCompleted(s.id, form));
    if (incompleteSteps.length > 0) {
      setValidationError(`미완료 항목: ${incompleteSteps.map(s => s.label).join(", ")}`);
      scrollToQuestion(incompleteSteps[0].id);
      return;
    }
    setValidationError("");

    // const isLoggedIn = status === "authenticated";
    // 가상진단으로 사용할 파트 연동 시 simulate 엔드포인트 활성화
    // const endpoint = isLoggedIn ? "/api/diagnosis/profile" : "/api/diagnosis/simulate";
    const endpoint = "/api/diagnosis/profile";

    setIsSubmitting(true);
    try {
      const result = await post(endpoint, {
          ...sanitizeDiagnosisForm(form),
          annualIncome: form.annualIncome * 10000,
          totalAsset: form.totalAsset * 10000,
          cashAsset: form.cashAsset * 10000,
        },
      );

      sessionStorage.removeItem("diagnosisFormTemp");
      sessionStorage.setItem("diagnosisResult", JSON.stringify(result));
      sessionStorage.setItem("diagnosisForm", JSON.stringify(sanitizeDiagnosisForm(form)));
      router.push("/site/condition-check/result");
    } catch {
      // 전역 ApiFeedbackModal이 자동 처리
    } finally {
      setIsSubmitting(false);
    }
  };

if (status === "unauthenticated") return (
  <AlertDialog open={true}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>로그인이 필요한 서비스입니다</AlertDialogTitle>
        <AlertDialogDescription>
          내 조건 진단은 로그인 후 이용할 수 있습니다.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => router.push("/site")}>
          취소
        </AlertDialogCancel>
        <AlertDialogAction onClick={() => router.push("/login?redirect=/site/condition-check")}>
          로그인하기
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

  return (
    <main className="bg-gray-50 min-h-screen">

      {/* 헤더 */}
        <div className="bg-white border-b py-6">
           <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-start">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">내 조건 진단</h1>
              <p className="text-sm text-gray-500 mt-1">몇 가지 정보를 입력하고 나에게 맞는 주거자격 진단을 받아보세요</p>
              {/* 모바일 진행률 */}
              <div className="mt-3 md:hidden">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>진행률</span>
                  <span className="font-bold text-blue-600">{dataProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${dataProgress}%` }} />
                </div>
              </div>
            </div>
            {/* 다시 진단 하기 버튼 */}
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">다시 진단하기</span>
            </Button>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">

        {/* 모바일: 스텝 네비 드롭다운 */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg text-sm font-semibold text-gray-700 shadow-sm"
          >
            <span>{STEPS[currentStep - 1]?.label} ({currentStep}/{STEPS.length})</span>
            {navOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {navOpen && (
            <div className="mt-1 bg-white border rounded-lg overflow-hidden shadow-sm">
              {STEPS.map((s) => {
                const completed = isStepCompleted(s.id, form);
                const isActive = s.id === currentStep;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      // 모바일 네비: 드롭다운 닫고 + 해당 질문으로 스크롤
                      setCurrentStep(s.id);
                      setNavOpen(false);
                      scrollToQuestion(s.id);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b last:border-0 transition-colors ${
                      isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                      completed ? "bg-blue-600 text-white" : isActive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                    }`}>
                      {completed ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 모바일: 선택확인란 드롭다운 */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg text-sm font-semibold text-gray-700 shadow-sm"
          >
            <span>나의 체크리스트</span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{summaryItems.length}개</span>
              {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {summaryOpen && (
            <div className="mt-1 bg-white border rounded-lg p-4 shadow-sm">
              {summaryItems.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">아직 입력된 항목이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {summaryItems.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-500 shrink-0">{item.label}</span>
                      <span className="font-bold text-right">{item.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 3컬럼(데스크탑) / 1컬럼(모바일) */}
        <div className="flex flex-col md:grid md:grid-cols-[200px_1fr_260px] gap-6 md:gap-8">

          {/* 좌측: 스텝 네비 (데스크탑만) */}
          <aside className="hidden md:block">
            <Card className="sticky top-8 shadow-lg border-none">
              <CardContent className="p-2">
                {/* <div className="mb-3 px-2 pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>진행률</span>
                    <span className="font-bold text-blue-600">{dataProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${dataProgress}%` }} />
                  </div>
                </div> */}
                <nav className="flex flex-col gap-1">
                  {STEPS.map((s) => {
                    const completed = isStepCompleted(s.id, form);
                    const isActive = s.id === currentStep;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          // 네비 클릭 시: 현재 스텝 표시 업데이트 + 해당 질문으로 스크롤
                          setCurrentStep(s.id);
                          scrollToQuestion(s.id);
                        }}
                        className={`flex items-center gap-3 p-3 text-sm rounded cursor-pointer transition-colors ${
                          isActive ? "bg-blue-600 text-white font-semibold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                          completed && isActive ? "bg-white text-blue-600" :
                          completed            ? "bg-blue-600 text-white" :
                          isActive             ? "bg-white text-blue-600" :
                                                 "bg-gray-200 text-gray-600"
                        }`}>
                          {completed
                            ? <Check className={`w-3 h-3 stroke-[3] ${isActive ? "text-blue-600" : "text-white"}`} />
                            : s.id}
                        </span>
                        {s.label}
                      </div>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* 중앙: 질문 섹션 */}
          <section className="space-y-6 min-w-0">
            <Card className="shadow-lg">
              <CardContent className="p-5 md:p-8 space-y-10 md:space-y-12">

                {/* Q1. 주거 형태 */}
                <div id="q1" className="space-y-4">
                  <QuestionHeader num={1} title="현재 주거 형태를 선택해 주세요." completed={isStepCompleted(1, form)} />
                  <div className="space-y-2">
                    {[
                      { label: "현재 임차(전/월세)로 거주 중입니다.", val: "임차" },
                      { label: "현재 본인 소유의 주택에 거주 중입니다.", val: "자가" },
                      { label: "기숙사/고시원/셰어하우스에 거주 중입니다.", val: "기타" },
                    ].map((item) => (
                      <RadioCard key={item.val} label={item.label} checked={form.currentResidence === item.val} onClick={() => update("currentResidence", item.val)} />
                    ))}
                  </div>
                </div>

                {/* Q2. 자산 및 소득 */}
                  <div id="q2" className="space-y-4">
                    <QuestionHeader num={2} title="자산 및 소득 정보를 입력해 주세요." completed={isStepCompleted(2, form)} />

                    {/* 총자산 - 버튼 선택 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">가구 총 자산 가액</p>
                      <p className="text-xs text-gray-400">* 부동산, 금융자산, 자동차 등 모든 자산 합산</p>
                      <p className="text-xs text-gray-400">* 자동차 단독 가액이 4,542만원 초과 시 일부 제도 신청 불가</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {[
                          { label: "1억 800만원 이하", val: 10800 },    // 대학생
                          { label: "2억 5,100만원 이하", val: 25100 },  // 청년
                          { label: "3억 4,500만원 이하", val: 34500 },  // 신혼부부·한부모
                          { label: "3억 4,500만원 초과", val: 34501 },  // 기준초과

                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => update("totalAsset", opt.val)}
                            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors text-center ${
                              form.totalAsset === opt.val
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* 선택된 값 표시 */}
                      {form.totalAsset > 0 && (
                        <p className="text-right text-sm text-blue-600 font-semibold">
                          = {formatAsset(form.totalAsset)} 이하
                        </p>
                      )}
                    </div>

                    {/* 현금성 자산 - 직접 입력 */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">현금성 자산 (만원)</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded bg-gray-50/50 gap-2">
                        <span className="text-xs text-gray-500">* 예금, 적금, 주식 등</span>
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="number"
                            placeholder="0"
                            min={0}
                            className="w-full sm:w-40 border-b border-gray-400 bg-transparent p-1 text-right focus:border-blue-500 outline-none font-semibold"
                            value={form.cashAsset || ""}
                            onChange={(e) => update("cashAsset", Number(e.target.value))}
                          />
                          <span className="text-sm font-bold shrink-0">만원</span>
                        </div>
                      </div>
                      {/* 현금성 자산 > 총자산 경고 */}
                      {form.cashAsset > 0 && form.totalAsset > 0 && form.cashAsset > form.totalAsset && (
                        <p className="text-xs text-red-500 font-medium text-right">
                          ⚠️ 현금성 자산이 총 자산보다 클 수 없습니다.
                        </p>
                      )}
                      {form.cashAsset > 0 && (
                        <p className="text-right text-sm text-blue-600 font-semibold">
                          = {formatAsset(form.cashAsset)}
                        </p>
                      )}
                    </div>

                    {/* 연간 소득 */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">연간 소득 (세전, 만원)</p>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded bg-gray-50/50 gap-2">
                        <span className="text-xs text-gray-500">* 세전 기준</span>
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="number"
                            placeholder="0"
                            min={0}
                            className="w-full sm:w-40 border-b border-gray-400 bg-transparent p-1 text-right focus:border-blue-500 outline-none font-semibold"
                            value={form.annualIncome || ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              update("annualIncome", v);
                              update("monthlyIncome", Math.floor(v / 12));
                            }}
                          />
                          <span className="text-sm font-bold shrink-0">만원</span>
                        </div>
                      </div>
                      {form.annualIncome > 0 && (
                        <p className="text-right text-sm text-blue-600 font-semibold">
                          = {formatAsset(form.annualIncome)} (월 {formatAsset(Math.floor(form.annualIncome / 12))})
                        </p>
                      )}
                    </div>

                  </div>

                {/* Q3. 무주택 정보 */}
                  <div id="q3" className="space-y-4">
                    <QuestionHeader num={3} title="무주택 및 세대 정보를 확인해 주세요." completed={isStepCompleted(3, form)} />

                    {/* 무주택 여부 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">무주택 여부</p>
                      {[
                        { label: "본인은 현재 무주택 세대주입니다.", val: true },
                        { label: "주택을 보유하고 있습니다.", val: false },
                      ].map((item) => (
                        <RadioCard
                          key={String(item.val)}
                          label={item.label}
                          checked={form.houseless === item.val}
                          onClick={() => update("houseless", item.val)}
                        />
                      ))}
                    </div>

                    {/* 세대분리 여부 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">세대 분리 여부</p>
                      {[
                        { label: "부모님과 세대가 분리되어 있습니다.", val: true },
                        { label: "부모님과 같은 세대입니다.", val: false },
                      ].map((item) => (
                        <RadioCard
                          key={String(item.val)}
                          label={item.label}
                          checked={form.householdSep === item.val}
                          onClick={() => update("householdSep", item.val)}
                        />
                      ))}
                    </div>
                  </div>

                {/* Q4. 생년월일 */}
                <div id="q4" className="space-y-4">
                  <QuestionHeader num={4} title="생년월일을 입력해 주세요." completed={isStepCompleted(4, form)} />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded bg-gray-50/50 gap-2">
                    <span className="text-sm text-gray-500">* 만 19~39세 청년 기준 적용</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.birthDate ? format(new Date(form.birthDate), "yyyy-MM-dd") : <span>날짜 선택</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.birthDate ? new Date(form.birthDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;
                            update("birthDate", format(date, "yyyy-MM-dd"));
                          }}
                          fromYear={1980}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          classNames={{
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {form.birthDate && (() => {
                    const today = new Date();
                    const birth = new Date(form.birthDate);
                    let age = today.getFullYear() - birth.getFullYear();
                    const m = today.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                    const isYouth = age >= 19 && age <= 39;
                    return (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isYouth ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${isYouth ? "bg-blue-600 text-white" : "bg-gray-300 text-white"}`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                        <span className="text-sm font-semibold">
                          만 {age}세 — {isYouth ? "청년 기준에 해당됩니다" : "청년 기준에 해당하지 않을 수 있습니다"}
                        </span>
                      </div>
                    );
                  })()}
                </div>

               {/* Q5. 청약 정보 */}
                  <div id="q5" className="space-y-4">
                    <QuestionHeader num={5} title="청약통장 정보를 알려주세요." completed={isStepCompleted(5, form)} />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">청약통장 보유 여부</p>
                      {[
                        { label: "청약통장을 보유하고 있습니다.", val: true },
                        { label: "청약통장이 없습니다.", val: false },
                      ].map((item) => (
                        <div key={String(item.val)}>
                          <RadioCard
                            label={item.label}
                            checked={form.hasSubscription === item.val}
                            onClick={() => update("hasSubscription", item.val)}
                          />
                          {item.val === true && form.hasSubscription === true && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded bg-gray-50/50 gap-2 mt-2">
                              <span className={`text-sm font-semibold ${
                                form.subscriptionMonths >= 24 ? "text-green-600" :
                                form.subscriptionMonths > 0 ? "text-amber-600" : "text-gray-500"
                              }`}>
                                {form.subscriptionMonths >= 24
                                  ? "✅ 1순위 충족"
                                  : form.subscriptionMonths > 0
                                  ? `⚠️ 1순위까지 ${24 - form.subscriptionMonths}개월 남음`
                                  : "* 24개월 이상 → 1순위"}
                              </span>
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="number"
                                  placeholder="0"
                                  className="w-24 border-b border-gray-400 bg-transparent p-1 text-right focus:border-blue-500 outline-none font-semibold"
                                  value={form.subscriptionMonths || ""}
                                  onChange={(e) => update("subscriptionMonths", Number(e.target.value))}
                                />
                                <span className="text-sm font-bold">개월</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Q6. 가구 정보 */}
                  <div id="q6" className="space-y-4">
                    <QuestionHeader num={6} title="가구 정보를 알려주세요." completed={isStepCompleted(6, form)} />

                    {/* 혼인 여부 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">혼인 여부</p>
                      {[
                        { label: "미혼입니다.", val: false },
                        { label: "기혼입니다. (신혼부부 특별공급 해당 가능)", val: true },
                      ].map((item) => (
                        <RadioCard key={String(item.val)} label={item.label} checked={form.married === item.val} onClick={() => update("married", item.val)} />
                      ))}
                    </div>

                    {/* 혼인 기간 - 기혼일 때만 */}
                      {form.married === true && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">혼인 기간</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "7년 이내", val: "WITHIN_7" },
                              { label: "7년 초과", val: "OVER_7" },
                            ].map((item) => (
                              <RadioCard key={item.val} label={item.label} checked={form.marriagePeriod === item.val} onClick={() => update("marriagePeriod", item.val)} />
                            ))}
                          </div>
                        </div>
                      )}

                    {/* 결혼 계획 - 미혼일 때만 (null이면 미선택이라 숨김) */}
                      {form.married === false && (
                        <label className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors gap-4">
                          <div>
                            <p className="font-semibold text-sm">결혼 예정이신가요?</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              결혼 예정이라면 행복주택 예비신혼부부 혜택을 받을 수 있습니다. 단 입주 전까지 혼인신고 증명이 가능한 경우에만 자격이 유지됩니다.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="w-6 h-6 accent-blue-600 shrink-0"
                            checked={form.marriagePlan}
                            onChange={(e) => update("marriagePlan", e.target.checked)}
                          />
                        </label>
                      )}

                    {/* 부양가족 수 */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded bg-gray-50/50 gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">부양가족 수</p>
                        <p className="text-xs text-gray-400">* 청약 가점 최대 35점 (6명 이상)</p>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="number" placeholder="0" min={0}
                          className="w-20 border-b border-gray-400 bg-transparent p-1 text-right focus:border-blue-500 outline-none font-semibold"
                          value={form.dependentCount || ""}
                          onChange={(e) => update("dependentCount", Number(e.target.value))}
                        />
                        <span className="text-sm font-bold">명</span>
                      </div>
                    </div>

                    {/* 고용 상태 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">고용 상태</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { label: "학생", val: "STUDENT" },
                          { label: "구직중", val: "JOB_SEEKER" },
                          { label: "사회초년생 (재직 3년 이하)", val: "NEWCOMER" },
                          { label: "재직중", val: "EMPLOYED" },
                          { label: "기타", val: "OTHER" },
                        ].map((item) => (
                          <RadioCard key={item.val} label={item.label} checked={form.employmentStatus === item.val} onClick={() => update("employmentStatus", item.val)} />
                        ))}
                      </div>
                    </div>

                    {/* 재직 기간 - EMPLOYED / NEWCOMER일 때만 */}
                    {(form.employmentStatus === "EMPLOYED" || form.employmentStatus === "NEWCOMER") && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">재직 기간</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "1년 미만", val: "UNDER_1" },
                            { label: "1~3년", val: "YEAR_1_3" },
                            { label: "3~5년", val: "YEAR_3_5" },
                            { label: "5년 이상", val: "OVER_5" },
                          ].map((item) => (
                            <RadioCard key={item.val} label={item.label} checked={form.employmentPeriod === item.val} onClick={() => update("employmentPeriod", item.val)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 장애인 / 영유아 자녀 / 한부모 */}
                    {[
                      {
                        key: "disabilityYn" as keyof DiagnosisForm,
                        title: "장애인 등록이 되어 있습니다.",
                        desc: "장애인 특별공급 및 우선순위 적용",
                        val: form.disabilityYn,
                      },
                      {
                        key: "hasYoungChild" as keyof DiagnosisForm,
                        title: "영유아 자녀가 있습니다.",
                        desc: "만 6세 이하 자녀 (신혼·한부모 우선공급 참고)",
                        val: form.hasYoungChild,
                      },
                      {
                        key: "singleParent" as keyof DiagnosisForm,
                        title: "한부모 가족입니다.",
                        desc: "한부모가족지원법 대상자",
                        val: form.singleParent,
                      },
                    ].map((item) => (
                      <label key={item.key} className="flex justify-between items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors gap-4">
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          className="w-6 h-6 accent-blue-600 shrink-0"
                          checked={item.val as boolean}
                          onChange={(e) => update(item.key, e.target.checked as DiagnosisForm[typeof item.key])}
                        />
                      </label>
                    ))}
                  </div>

                {/* Q7. 희망 조건 */}
                <div id="q7" className="space-y-4">
                  <QuestionHeader num={7} title="희망 거주 조건을 선택해 주세요." completed={isStepCompleted(7, form)} />

                  {/* 희망 도시 - 클릭 버튼 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">희망 도시</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {Object.keys(DISTRICT_MAP).map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleCityChange(city)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                            form.desiredCity === city
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 희망 지역구 - 도시 선택 후 클릭 */}
                  {form.desiredCity && DISTRICT_MAP[form.desiredCity] && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        희망 지역구 <span className="text-blue-600 font-bold">({form.desiredCity})</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 border rounded-lg bg-gray-50">
                        {DISTRICT_MAP[form.desiredCity].map((district) => (
                          <button
                            key={district}
                            type="button"
                            onClick={() => update("desiredDistrict", district)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors text-left ${
                              form.desiredDistrict === district
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                            }`}
                          >
                            {district}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 희망 면적 - 평/㎡ 동시 입력 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">희망 면적</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">평수 입력</p>
                        <div className="flex items-center gap-2 p-3 border rounded bg-gray-50/50">
                          <input
                            type="number"
                            placeholder="예: 25"
                            className="w-full border-b border-gray-400 bg-transparent p-1 text-right focus:border-blue-500 outline-none font-semibold"
                            value={pyeongInput}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPyeongInput(v);
                              update("desiredArea", v ? pyeongToSqm(Number(v)) : 0);
                            }}
                          />
                          <span className="text-sm font-bold shrink-0">평</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">㎡ 입력</p>
                        <div className="flex items-center gap-2 p-3 border rounded bg-gray-50/50">
                          <input
                            type="number"
                            placeholder="예: 84"
                            className="w-full border-b border-gray-400 bg-transparent p-1 text-right focus:border-blue-500 outline-none font-semibold"
                            value={form.desiredArea || ""}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              update("desiredArea", v);
                              setPyeongInput(v ? String(sqmToPyeong(v)) : "");
                            }}
                          />
                          <span className="text-sm font-bold shrink-0">㎡</span>
                        </div>
                      </div>
                    </div>
                    {form.desiredArea > 0 && (
                      <p className="text-xs text-blue-600 font-semibold text-right">
                        {sqmToPyeong(form.desiredArea)}평 = {form.desiredArea}㎡
                      </p>
                    )}
                    {/* 자주 쓰는 평형 빠른 선택 */}
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "원룸 20㎡", sqm: 20 },
                        { label: "1.5룸 33㎡", sqm: 33 },
                        { label: "소형 59㎡", sqm: 59 },
                        { label: "중형 84㎡", sqm: 84 },
                      ].map((preset) => (
                        <button
                          key={preset.sqm}
                          type="button"
                          onClick={() => {
                            update("desiredArea", preset.sqm);
                            setPyeongInput(String(sqmToPyeong(preset.sqm)));
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            form.desiredArea === preset.sqm
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 희망 주택 유형 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">희망 주택 유형</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DESIRED_TYPE_OPTIONS.map((opt) => (
                        <RadioCard key={opt} label={opt} checked={form.desiredType === opt} onClick={() => update("desiredType", opt)} />
                      ))}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex justify-end pb-8">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 font-bold active:scale-95 transition-all"
              >
                진단 결과 보기
              </Button>
            </div>
          </section>

          {/* 우측: 선택확인란 (데스크탑만) */}
          <aside className="hidden md:block">
            <Card className="sticky top-8 shadow-lg border-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h3 className="font-bold text-sm">나의 체크리스트</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{summaryItems.length}개 입력</span>
                </div>
                {summaryItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">항목을 입력하면<br />여기에 표시됩니다.</p>
                ) : (
                  <ul className="text-sm space-y-3">
                    {summaryItems.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="text-gray-500 text-xs shrink-0">{item.label}</span>
                        <span className="font-bold text-xs text-right">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>전체 진행률</span>
                    <span className="font-bold text-blue-600">{dataProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${dataProgress}%` }} />
                  </div>
                </div>

                {/* ── 자주 묻는 질문 아코디언 설명 패널 ── */}
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> 자주 묻는 질문
                    </p>
                    <Accordion type="single" collapsible className="w-full">
                    {/* 무주택 */}
                      <AccordionItem value="houseless" className="border-b-0">
                          <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-gray-700">
                            <span className="flex items-center gap-1.5"><Home className="w-3 h-3" /> 집이 없으면 다 무주택자인가요?</span>
                          </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pb-2">
                        나뿐만 아니라 같이 사는 가족(세대원) 모두 집이 없어야 해요. 
                        오피스텔은 괜찮은 경우가 많지만, 공공주택 신청 시에는 꼭 다시 확인해야 합니다.
                      </AccordionContent>
                    </AccordionItem>

                    {/* 세대분리 */}
                        <AccordionItem value="householdSep" className="border-b-0">
                          <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-gray-700">
                            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> 세대분리, 왜 해야 하나요?</span>
                          </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pb-2">
                        부모님과 서류상 주거지를 나누는 거예요. 
                        독립된 가구로 인정받아야 청년 전용 대출이나 주거 지원을 받기 훨씬 유리해집니다.
                      </AccordionContent>
                    </AccordionItem>

                    {/* 청약통장 */}
                    <AccordionItem value="subscription" className="border-b-0">
                      <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-gray-700">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> 청약통장, 꼭 있어야 하나요?</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pb-2">
                        내 집 마련의 기본 티켓입니다. 2년(24회) 이상 부어야 1순위로 유리해져요.
                      </AccordionContent>
                    </AccordionItem>

                    {/* 소득 기준 */}
                     <AccordionItem value="income" className="border-b-0">
                        <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-gray-700">
                          <span className="flex items-center gap-1.5"><Wallet className="w-3 h-3" /> 소득 기준, 얼마까지 괜찮나요?</span>
                        </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pb-2">
                         보통 1인 가구 월 381만원(2026 행복주택 기준) 이하가 기준이에요. 내 소득에 따라 신청 가능한 주택이 달라집니다.
                      </AccordionContent>
                    </AccordionItem>

                    {/* 결혼 계획 */}
                     <AccordionItem value="marriagePlan" className="border-b-0">
                      <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-gray-700">
                        <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" /> 결혼 계획, 왜 물어보나요?</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pb-2">
                        예비 신혼부부라면 당첨 확률이 높은 '특별공급'과 저금리 대출 혜택을 받을 수 있기 때문이에요.
                      </AccordionContent>
                    </AccordionItem>

                    {/* 행복주택 */}
                    <AccordionItem value="happy" className="border-b-0">
                      <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-gray-700">
                        <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> 행복주택이 정확히 뭐에요?</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pb-2">
                        국가가 청년들을 위해 싸게 내놓은 집이에요.
                        시세보다 60~80% 수준 임대료로 훨씬 저렴하게 최대 6년까지 살 수 있어요.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </aside>

        </div>
      </div>
    </main>
  );
};

export default HousingFormPage;
