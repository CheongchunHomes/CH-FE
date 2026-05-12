'use client';

import React, { useState, useEffect } from 'react';

interface Transaction {
  expenditure_id?: number;
  user_id: number;
  category: string;
  amount: number;
  method: string;
  memo: string;
  spent_at: string;
  created_at?: string;
}

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState('지출조회');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userId, setUserId] = useState<number | null>(1);

  const [viewMonth, setViewMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [selectedCategory, setSelectedCategory] = useState('전체');

  const [formData, setFormData] = useState({
    spent_at: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    method: '카드',
    memo: '',
  });

  const MAIN_COLOR = '#2196F3';
  const CATEGORIES = ['전체', '식비', '교통', '기타'];
  const METHODS = ['카드', '현금', '쿠폰'];

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');

    if (savedUserId) {
      setUserId(Number(savedUserId));
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchLedgers();
    }
  }, [userId]);

  const fetchLedgers = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/ledger/list?userId=${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('조회 실패:', response.status, errorText);

        return;
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오지 못했습니다.');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category || !userId) {
      alert('금액과 카테고리를 입력하세요.');
      return;
    }

    const newEntry = {
      user_id: userId,
      category: formData.category,
      amount: Number(formData.amount),
      method: formData.method,
      memo: formData.memo,
      spent_at: formData.spent_at,
    };

    try {
      const response = await fetch('/api/ledger/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('저장 실패:', response.status, errorText);
        alert(`저장 실패: ${response.status}`);
        return;
      }

      const savedData = await response.json();

      setTransactions((prev) => [savedData, ...prev]);
      setViewMonth(formData.spent_at.slice(0, 7));

      setFormData({
        spent_at: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        method: '카드',
        memo: '',
      });

      setSelectedCategory('전체');
      setActiveTab('지출조회');

      alert('저장 완료');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('서버 연결 실패');
    }
  };

  const monthlyTransactions = transactions.filter(
    (t) => t.spent_at && t.spent_at.startsWith(viewMonth)
  );

  const filteredTransactions =
    selectedCategory === '전체'
      ? monthlyTransactions
      : monthlyTransactions.filter((t) => t.category === selectedCategory);

  const displayTotal = filteredTransactions.reduce(
    (acc, cur) => acc + Number(cur.amount),
    0
  );

  const monthlySummary = transactions.reduce((acc, cur) => {
    if (!cur.spent_at) return acc;

    const month = cur.spent_at.slice(0, 7);

    if (!acc[month]) {
      acc[month] = 0;
    }

    acc[month] += Number(cur.amount);

    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={pageStyle}>
      <aside style={sideBarStyle}>
        <h2 style={sideTitleStyle}>가계부</h2>

        {['지출조회', '지출입력', '월별조회'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...sideButtonStyle,
              backgroundColor: activeTab === tab ? MAIN_COLOR : '#ffffff',
              color: activeTab === tab ? '#ffffff' : '#333333',
            }}
          >
            {tab}
          </button>
        ))}
      </aside>

      <main style={mainStyle}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={contentBoxStyle}>
            {activeTab === '지출입력' && (
              <form onSubmit={handleSubmit} style={formStyle}>
                <div style={formTitleStyle}>
                  <h2
                    style={{
                      fontSize: '20px',
                      color: MAIN_COLOR,
                      margin: 0,
                    }}
                  >
                    지출 정보 입력
                  </h2>
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>지출 일자</label>
                  <input
                    name="spent_at"
                    type="date"
                    value={formData.spent_at}
                    onChange={handleInputChange}
                    style={webInputStyle}
                  />
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>지출 금액</label>
                  <input
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    style={webInputStyle}
                    placeholder="예: 12000"
                  />
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>카테고리</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={webInputStyle}
                  >
                    <option value="">선택</option>
                    {CATEGORIES.filter((c) => c !== '전체').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={inputGroup}>
                  <label style={labelStyle}>결제 방식</label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    style={webInputStyle}
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>메모</label>
                  <input
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    style={{ ...webInputStyle, backgroundColor: '#fffbe6' }}
                    placeholder="예: 점심 식사"
                  />
                </div>

                <button type="submit" style={submitButtonStyle}>
                  저장하기
                </button>
              </form>
            )}

            {activeTab === '지출조회' && (
              <div>
                <div style={topRowStyle}>
                  <h2 style={{ fontSize: '20px', margin: 0 }}>
                    상세 지출 내역
                  </h2>

                  <input
                    type="month"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(e.target.value)}
                    style={monthInputStyle}
                  />
                </div>

                <table style={tableStyle}>
                  <thead>
                    <tr style={headRowStyle}>
                      <th style={thStyle}>날짜</th>
                      <th style={thStyle}>카테고리</th>
                      <th style={thStyle}>결제방식</th>
                      <th style={thStyle}>메모</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>금액</th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={emptyStyle}>
                          지출 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      monthlyTransactions.map((t, idx) => (
                        <tr
                          key={t.expenditure_id ?? idx}
                          style={bodyRowStyle}
                        >
                          <td style={tdStyle}>{t.spent_at}</td>

                          <td style={tdStyle}>
                            <span style={badgeStyle}>{t.category}</span>
                          </td>

                          <td style={tdStyle}>{t.method}</td>

                          <td style={tdStyle}>{t.memo || '-'}</td>

                          <td style={amountStyle}>
                            -{Number(t.amount).toLocaleString()}원
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === '월별조회' && (
              <div>
                <div style={topRowStyle}>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>
                    {viewMonth} 통계 리포트
                  </h3>

                  <input
                    type="month"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(e.target.value)}
                    style={monthInputStyle}
                  />
                </div>

                <div style={statWrapStyle}>
                  <div style={statCard}>
                    <span style={statTitle}>{selectedCategory} 지출 합계</span>

                    <strong style={{ fontSize: '24px' }}>
                      {displayTotal.toLocaleString()}원
                    </strong>
                  </div>

                  <div style={statCard}>
                    <span style={statTitle}>{selectedCategory} 건수</span>

                    <strong style={{ fontSize: '24px' }}>
                      {filteredTransactions.length}건
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={categoryLabelStyle}>카테고리 선택조회</label>

                  <div style={categoryButtonWrapStyle}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          ...categoryButtonStyle,
                          backgroundColor:
                            selectedCategory === cat ? MAIN_COLOR : '#f0f0f0',
                          color: selectedCategory === cat ? '#ffffff' : '#666666',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 style={{ marginTop: '30px', color: MAIN_COLOR }}>
                  전체 월별 총 지출
                </h3>

                <table style={tableStyle}>
                  <thead>
                    <tr style={headRowStyle}>
                      <th style={thStyle}>월</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>
                        총 지출액
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(monthlySummary).length === 0 ? (
                      <tr>
                        <td colSpan={2} style={emptyStyle}>
                          지출 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(monthlySummary)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([month, total]) => (
                          <tr key={month} style={bodyRowStyle}>
                            <td style={tdStyle}>{month}</td>
                            <td style={amountStyle}>
                              {total.toLocaleString()}원
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f5f7fa',
  fontFamily: 'Pretendard, sans-serif',
};

const sideBarStyle: React.CSSProperties = {
  width: '220px',
  backgroundColor: '#e3f2fd',
  padding: '40px 20px',
  borderRight: '1px solid #d0d7de',
};

const sideTitleStyle: React.CSSProperties = {
  color: '#2196F3',
  textAlign: 'center',
  marginBottom: '30px',
};

const sideButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  marginBottom: '12px',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: '0.2s',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '40px 20px',
};

const contentBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '30px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
};

const formStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
};

const formTitleStyle: React.CSSProperties = {
  gridColumn: 'span 2',
  borderBottom: '1px solid #eeeeee',
  paddingBottom: '15px',
};

const inputGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#555555',
};

const webInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid #dddddd',
  fontSize: '14px',
  outlineColor: '#2196F3',
};

const submitButtonStyle: React.CSSProperties = {
  gridColumn: 'span 2',
  padding: '15px',
  backgroundColor: '#2196F3',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const topRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '25px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const headRowStyle: React.CSSProperties = {
  borderBottom: '2px solid #f4f4f4',
  textAlign: 'left',
};

const bodyRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #f9f9f9',
};

const thStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '13px',
  color: '#999999',
};

const tdStyle: React.CSSProperties = {
  padding: '15px 12px',
  fontSize: '15px',
  color: '#333333',
};

const amountStyle: React.CSSProperties = {
  padding: '15px 12px',
  fontSize: '15px',
  textAlign: 'right',
  fontWeight: 'bold',
  color: '#e53935',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#e3f2fd',
  color: '#2196F3',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 'bold',
};

const monthInputStyle: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: '4px',
  border: '1px solid #2196F3',
  fontWeight: 'bold',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#aaaaaa',
};

const statWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  marginBottom: '30px',
};

const statCard: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#2196F3',
  padding: '20px',
  borderRadius: '10px',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const statTitle: React.CSSProperties = {
  fontSize: '12px',
  backgroundColor: 'rgba(255,255,255,0.2)',
  padding: '2px 6px',
  width: 'fit-content',
  borderRadius: '3px',
};

const categoryLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 'bold',
  display: 'block',
  marginBottom: '10px',
  color: '#555555',
};

const categoryButtonWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const categoryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '20px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '13px',
  transition: '0.2s',
};