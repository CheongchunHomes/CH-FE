'use client';

import { useEffect, useState } from 'react';
import PolicyCard from './components/PolicyCard';
import { categoryInfo } from './components/CategoryInfo';

// ─────────────────────────────────────────────
// 팀원 연결 포인트
// 1단계 팀원: DiagnosisResult 타입대로 데이터 넘겨주면 점수 카드 자동 표시됨
// 3단계 팀원: Recoentity[] 배열 그대로 policies에 넣으면 됨
// ─────────────────────────────────────────────

const API_BASE = '/api/recommend/summary';

export interface Recoentity {
  id: number;
  name: string;
  category: string;
  minAge: number;
  maxAge: number;
  maxIncome: number;
  region: string;
  description: string;
  applyUrl: string;
  active: boolean;
}

export interface UserProfile {
  profileId: number;
  userId: number;
  birthDate: string;
  isMarried: boolean;
  isHouseless: boolean;
  currentResidence: string;
  annualIncome: number;
  subscriptionMonths: number;
  desiredCity: string;
  desiredDistrict: string;
}

export interface DiagnosisResult {
  diagnosisResultId: number;
  userId: number;
  homelessStatus: string;
  ageStatus: string;
  incomeStatus: string;
  subscriptionReadinessScore: number;
  publicRentalFitScore: number;
  jeonseloanScore: number;
  saleSubscriptionScore: number;
  subscriptionReadinessGrade: string;
  publicRentalFitGrade: string;
  jeonseloanGrade: string;
  saleSubscriptionGrade: string;
}

interface Summary {
  profile: UserProfile | null;
  diagnosis: DiagnosisResult | null;
  policies: Recoentity[];
}

// ─────────────────────────────────────────────
// 스타일 상수
// ─────────────────────────────────────────────

const CAT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  '공공임대':   { bg: '#FFF3E8', text: '#C2410C', border: '#FB923C' },
  '민간분양':   { bg: '#EFF6FF', text: '#1D4ED8', border: '#60A5FA' },
  '전세지원':   { bg: '#F0FDF4', text: '#15803D', border: '#4ADE80' },
  '주거비지원': { bg: '#FAF5FF', text: '#7E22CE', border: '#C084FC' },
  '금융지원':   { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D' },
};

const GRADE_COLOR: Record<string, string> = {
  A: '#16A34A', B: '#1976D2', C: '#db287c', D: '#E53935',
};

const CATEGORIES = ['공공임대', '민간분양', '전세지원', '주거비지원', '금융지원'];

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────

export default function RecommendPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [modalPolicy, setModalPolicy] = useState<Recoentity | null>(null);

  useEffect(() => {
    fetch(API_BASE)
      .then(r => {
        if (!r.ok) throw new Error('서버 응답 오류');
        return r.json();
      })
      .then((data: Summary) => { setSummary(data); setLoading(false); })
      .catch(() => { setError('서버에 연결할 수 없습니다.'); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;
  if (error || !summary) return <ErrorScreen message={error ?? '알 수 없는 오류'} />;

  const { policies, diagnosis } = summary;

  // 점수 카드 - diagnosis 없으면 숨김
  const scores = diagnosis ? [
    { label: '청약준비도',     score: diagnosis.subscriptionReadinessScore, grade: diagnosis.subscriptionReadinessGrade },
    { label: '공공임대 적합도', score: diagnosis.publicRentalFitScore,       grade: diagnosis.publicRentalFitGrade },
    { label: '전세대출 가능성', score: diagnosis.jeonseloanScore,            grade: diagnosis.jeonseloanGrade },
    { label: '분양청약 가능성', score: diagnosis.saleSubscriptionScore,      grade: diagnosis.saleSubscriptionGrade },
  ] : null;

  const activeCats = CATEGORIES.filter(c => policies.some(p => p.category === c));

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Apple SD Gothic Neo', Pretendard, sans-serif" }}>

      {/* 스텝 바 */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '10px 20px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'step1. 자가진단', active: false },
            null,
            { label: 'step2. 제도추천', active: true },
            null,
            { label: 'step3. 대출계산', active: false },
            null,
            { label: 'step4. 집·공고 확인', active: false },
            null,
            { label: 'step5. 계약', active: false },
          ].map((item, i) =>
            item === null
              ? <span key={i} style={{ color: '#D1D5DB', fontSize: 12 }}>›</span>
              : <span key={i} style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 20,
                  background: item.active ? '#1976D2' : '#F3F4F6',
                  color: item.active ? '#fff' : '#9CA3AF',
                  fontWeight: item.active ? 500 : 400,
                }}>{item.label}</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px' }}>

        {/* 점수 카드 - diagnosis 있을 때만 표시 */}
        {scores && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
            {scores.map(s => (
              <div key={s.label} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 500, color: GRADE_COLOR[s.grade] ?? '#374151' }}>{s.score}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>점</span>
                  <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 500, color: GRADE_COLOR[s.grade] ?? '#374151' }}>{s.grade}</span>
                </div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
                  <div style={{ width: `${s.score}%`, height: '100%', background: GRADE_COLOR[s.grade] ?? '#1976D2', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 진단결과 헤더 */}
        <div style={{ marginBottom: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#1976D2' }}>진단결과</span>
          {activeCats.map(cat => {
            const s = CAT_STYLE[cat];
            return (
              <span key={cat} style={{ fontSize: 12, background: s.bg, color: s.text, padding: '2px 10px', borderRadius: 6, fontWeight: 500 }}>
                {cat}
              </span>
            );
          })}
          <span style={{ fontSize: 13, color: '#6B7280' }}>신청이 가능할 것으로 예상됩니다.</span>
        </div>

        {/* 카테고리 섹션 */}
        {CATEGORIES.map(cat => {
          const list = policies.filter(p => p.category === cat);
          if (!list.length) return null;
          const s = CAT_STYLE[cat] ?? { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
          const isOpen = openCategory === cat;

          return (
            <div key={cat} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
              {/* 섹션 헤더 - 클릭으로 토글 */}
              <div
                onClick={() => setOpenCategory(isOpen ? null : cat)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}
              >
                <span style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 6 }}>
                  {cat}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#111', flex: 1 }}>{cat} 신청 가능 ({list.length}건)</span>
                <span style={{
                  fontSize: 20, lineHeight: 1, color: '#6B7280',
                  background: '#F3F4F6', border: '0.5px solid #E5E7EB',
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  {isOpen ? '−' : '+'}
                </span>
              </div>

              {/* 정책 리스트 - 펼쳤을 때만 표시 */}
              {isOpen && (
                <div style={{ borderTop: '0.5px solid #F3F4F6' }}>
                  {list.map((policy, i) => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      isLast={i === list.length - 1}
                      borderColor={s.border}
                      onDetail={() => setModalPolicy(policy)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 상세보기 모달 */}
      {modalPolicy && (
        <PolicyModal policy={modalPolicy} onClose={() => setModalPolicy(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 상세보기 모달
// ─────────────────────────────────────────────

function PolicyModal({ policy, onClose }: { policy: Recoentity; onClose: () => void }) {
  const s = CAT_STYLE[policy.category] ?? { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500,
          maxHeight: '80vh', overflowY: 'auto', padding: 24,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 500, color: '#111', marginBottom: 16, paddingBottom: 12, borderBottom: '0.5px solid #E5E7EB' }}>
          {policy.name}
        </div>

        {[
          { label: '카테고리', value: <span style={{ background: s.bg, color: s.text, fontSize: 12, padding: '2px 10px', borderRadius: 6 }}>{policy.category}</span> },
          { label: '대상지역', value: policy.region },
          { label: '연령기준', value: `${policy.minAge}~${policy.maxAge}세` },
          { label: '소득기준', value: `연 ${Math.round(policy.maxIncome / 10000000)}천만원 이하` },
          { label: '사업개요', value: policy.description },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F3F4F6', fontSize: 13 }}>
            <span style={{ color: '#9CA3AF', minWidth: 70, fontWeight: 500, flexShrink: 0 }}>{row.label}</span>
            <span style={{ color: '#374151', flex: 1, lineHeight: 1.6 }}>{row.value}</span>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {policy.applyUrl && (
            <a
              href={policy.applyUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1, textAlign: 'center', padding: '10px 0',
                background: '#1976D2', color: '#fff', borderRadius: 8,
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
              }}
            >
              홈페이지 바로가기 →
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', background: '#F3F4F6',
              color: '#374151', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 로딩 / 에러 화면
// ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTop: '3px solid #1976D2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#9CA3AF', fontSize: 14 }}>맞춤 정책을 불러오는 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', gap: 12 }}>
      <span style={{ fontSize: 36 }}>⚠️</span>
      <p style={{ color: '#DC2626', fontWeight: 500, textAlign: 'center', maxWidth: 400, fontSize: 14 }}>{message}</p>
      <button onClick={() => window.location.reload()} style={{ background: '#1976D2', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
        다시 시도
      </button>
    </div>
  );
}