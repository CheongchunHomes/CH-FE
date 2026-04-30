'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar';

const API_BASE = '/api/recommend/summary';

interface Recoentity {
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

interface UserProfile {
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

interface DiagnosisResult {
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
  profile: UserProfile;
  diagnosis: DiagnosisResult;
  policies: Recoentity[];
}

const categoryStyle: Record<string, { bg: string; text: string; border: string }> = {
  '공공임대':   { bg: '#FFF3E8', text: '#C2410C', border: '#FB923C' },
  '민간분양':   { bg: '#EFF6FF', text: '#1D4ED8', border: '#60A5FA' },
  '전세지원':   { bg: '#F0FDF4', text: '#15803D', border: '#4ADE80' },
  '주거비지원': { bg: '#FAF5FF', text: '#7E22CE', border: '#C084FC' },
  '금융지원':   { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D' },
};

const gradeColor: Record<string, string> = {
  A: '#16A34A', B: '#2563EB', C: '#db287c', D: '#fa0d0d',
};

const CATEGORIES = ['공공임대', '민간분양', '전세지원', '주거비지원', '금융지원'];

export default function RecommendPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('전체');

  useEffect(() => {
    fetch(`${API_BASE}`)
      .then(r => {
        if (!r.ok) throw new Error('서버 응답 오류');
        return r.json();
      })
      .then((data: Summary) => { setSummary(data); setLoading(false); })
      .catch(() => {
        setError('Spring Boot 서버(8080)에 연결할 수 없습니다.');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingScreen />;
  if (error || !summary) return <ErrorScreen message={error ?? '알 수 없는 오류'} />;

  const { profile, diagnosis, policies } = summary;
  const age = new Date().getFullYear() - new Date(profile.birthDate).getFullYear();

  const tabs = ['전체', ...CATEGORIES.filter(c => policies.some(p => p.category === c))];
  const filtered = activeTab === '전체' ? policies : policies.filter(p => p.category === activeTab);

  const scores = [
    { label: '청약준비도',     score: diagnosis.subscriptionReadinessScore, grade: diagnosis.subscriptionReadinessGrade },
    { label: '공공임대 적합도', score: diagnosis.publicRentalFitScore,       grade: diagnosis.publicRentalFitGrade },
    { label: '전세대출 가능성', score: diagnosis.jeonseloanScore,            grade: diagnosis.jeonseloanGrade },
    { label: '분양청약 가능성', score: diagnosis.saleSubscriptionScore,      grade: diagnosis.saleSubscriptionGrade },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Apple SD Gothic Neo', 'Pretendard', sans-serif" }}>

        <Navbar />

      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>step1. 자가진단</span>
          <span style={{ color: '#D1D5DB' }}>›</span>
          <span style={{ background: '#2196F3', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>step2. 제도추천 - 진단결과 확인</span>
          <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>step3. 대출계산</span>
          <span style={{ color: '#D1D5DB' }}>›</span>
           <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>step4. 집 · 공고 확인</span>
          <span style={{ color: '#D1D5DB' }}>›</span>
          <span style={{ background: '#F3F4F6', color: '#9CA3AF', fontSize: 12, padding: '4px 14px', borderRadius: 20 }}>step5. 계약</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#2196F3' }}>진단결과</span>
            {tabs.filter(t => t !== '전체').map(cat => (
              <span key={cat} style={{ fontSize: 13, background: categoryStyle[cat]?.bg, color: categoryStyle[cat]?.text, padding: '2px 10px', borderRadius: 6, fontWeight: 600 }}>{cat}</span>
            ))}
            <span style={{ fontSize: 13, color: '#6B7280' }}>신청이 가능할 것으로 예상됩니다.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 20 }}>
            {scores.map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: gradeColor[s.grade] ?? '#374151' }}>{s.score}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>점</span>
                  <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 900, color: gradeColor[s.grade] ?? '#374151' }}>{s.grade}</span>
                </div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
                  <div style={{ width: `${s.score}%`, height: '100%', background: gradeColor[s.grade] ?? '#2196F3', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                background: activeTab === t ? '#2196F3 ' : '#F3F4F6',
                color: activeTab === t ? '#fff' : '#6B7280',
              }}>
                {t === '전체' ? `전체 (${policies.length})` : t}
              </button>
            ))}
          </div>

          {CATEGORIES.map(cat => {
            const list = filtered.filter(p => p.category === cat);
            if (list.length === 0) return null;
            const s = categoryStyle[cat] ?? { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
            return (
              <div key={cat} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>{cat}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{cat} 신청이 가능합니다.</span>
                </div>
                {list.map((policy, i) => (
                  <div key={policy.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < list.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.border, flexShrink: 0, display: 'inline-block' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{policy.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                          {policy.region} · {policy.minAge}~{policy.maxAge}세 · 소득 {(policy.maxIncome / 1000).toFixed(0)}천만원 이하
                        </div>
                      </div>
                    </div>
                    <a href="/apply-sample" target="_blank" rel="noreferrer"
                      style={{ background: '#3B82F6', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      신청하기
                    </a>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ width: 190, flexShrink: 0, position: 'sticky', top: 76 }}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ background: '#374151', padding: '11px 14px' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>선택 프로필</span>
            </div>
            {[
              { label: '지역',        value: profile.currentResidence,                 highlight: false },
              { label: '연령',        value: `만 ${age}세`,                             highlight: true  },
              { label: '주택소유여부', value: profile.isHouseless ? '무주택' : '유주택', highlight: true  },
              { label: '미혼/기혼',   value: profile.isMarried ? '기혼' : '미혼',       highlight: true  },
              { label: '청약 가입',   value: `${profile.subscriptionMonths}개월`,       highlight: false },
              { label: '희망지역',    value: profile.desiredCity ?? '-',                highlight: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid #F9FAFB' }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.highlight ? '#2196F3' : '#374151' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#FFF9F7', border: '1px solid #FCD9CC', borderRadius: 14, padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2196F3', marginBottom: 8 }}>💡 AI 청약 전략</div>
            <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
              현재 점수로는 <b>공공임대·전세임대</b>를 우선 추천합니다. 청약통장 납입 기간을 늘리면 2년 내 점수 향상이 가능합니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '4px solid #E5E7EB', borderTop: '4px solid #2196F3 ', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#9CA3AF', fontSize: 15 }}>맞춤 정책을 불러오는 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', gap: 12 }}>
      <span style={{ fontSize: 40 }}>⚠️</span>
      <p style={{ color: '#DC2626', fontWeight: 700, textAlign: 'center', maxWidth: 400 }}>{message}</p>
      <button onClick={() => window.location.reload()} style={{ background: '#2196F3', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
        다시 시도
      </button>
    </div>
  );
}