'use client';

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

interface Props {
  policy: Recoentity;
  isLast: boolean;
  borderColor: string;
}

export default function PolicyCard({ policy, isLast, borderColor }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: isLast ? 'none' : '1px solid #F9FAFB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: borderColor, flexShrink: 0, display: 'inline-block' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{policy.name}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {policy.region} · {policy.minAge}~{policy.maxAge}세 · 소득 {(policy.maxIncome / 1000).toFixed(0)}천만원 이하
          </div>
        </div>
      </div>
      <a href="/apply-sample" target="_blank" rel="noreferrer"
        style={{ background: '#3B82F6', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        목록보기
      </a>
    </div>
  );
}