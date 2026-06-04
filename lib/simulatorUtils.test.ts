// lib/simulatorUtils.test.ts
// simulatorUtils 순수함수 단위 테스트
// npm test 로 실행

import {
  calcSchedule,
  calcInterestOnly,
  calcDsr,
  calcProgress,
  calcSavingBreakdown,
  calcDday,
  isOverdue,
  getEulReul,
  formatCurrency,
  formatManwon,
  formatWon,
} from "@/lib/simulatorUtils"

// ─────────────────────────────────────────
// calcSchedule — 원리금균등상환
// ─────────────────────────────────────────

describe("calcSchedule", () => {
  test("정상: 1억 / 3.5% / 60개월 — 60행 반환", () => {
    const rows = calcSchedule(100_000_000, 3.5, 60)
    expect(rows).toHaveLength(60)
  })

  test("1회차: seq=1, payment/interest/repayment 모두 양수", () => {
    const rows = calcSchedule(100_000_000, 3.5, 60)
    const first = rows[0]
    expect(first.seq).toBe(1)
    expect(first.payment).toBeGreaterThan(0)
    expect(first.interest).toBeGreaterThan(0)
    expect(first.repayment).toBeGreaterThan(0)
  })

  test("마지막 회차 잔액 = 0", () => {
    const rows = calcSchedule(100_000_000, 3.5, 60)
    expect(rows[59].balance).toBe(0)
  })

  test("마지막 회차 제외 납입액 일정 (오차 1원 이내)", () => {
    const rows = calcSchedule(100_000_000, 3.5, 60)
    const payments = rows.slice(0, -1).map((r) => r.payment)
    expect(Math.max(...payments) - Math.min(...payments)).toBeLessThanOrEqual(1)
  })

  test("총 납입원금 합계 = 대출원금 (오차 1원 이내)", () => {
    const principal = 100_000_000
    const rows = calcSchedule(principal, 3.5, 60)
    const totalRepayment = rows.reduce((s, r) => s + r.repayment, 0)
    expect(Math.abs(totalRepayment - principal)).toBeLessThanOrEqual(1)
  })


  test("원금 0 → 빈 배열", () => {
    expect(calcSchedule(0, 3.5, 60)).toEqual([])
  })

  test("음수 원금 → 빈 배열", () => {
    expect(calcSchedule(-1_000_000, 3.5, 60)).toEqual([])
  })

  test("개월수 0 → 빈 배열", () => {
    expect(calcSchedule(100_000_000, 3.5, 0)).toEqual([])
  })

  test("음수 금리 → 빈 배열", () => {
    expect(calcSchedule(100_000_000, -1, 60)).toEqual([])
  })
})

// ─────────────────────────────────────────
// calcInterestOnly — 원금거치 월 이자
// ─────────────────────────────────────────

describe("calcInterestOnly", () => {
  test("1억 / 연 3.5% → 월 이자 291,667원", () => {
    // 100,000,000 × 0.035 / 12 = 291,666.6... → 반올림 291,667
    expect(calcInterestOnly(100_000_000, 3.5)).toBe(291_667)
  })

  test("원금 0 → 0", () => {
    expect(calcInterestOnly(0, 3.5)).toBe(0)
  })

  test("금리 0 → 0", () => {
    expect(calcInterestOnly(100_000_000, 0)).toBe(0)
  })

  test("음수 원금 → 0", () => {
    expect(calcInterestOnly(-1_000_000, 3.5)).toBe(0)
  })

  test("음수 금리 → 0", () => {
    expect(calcInterestOnly(100_000_000, -3.5)).toBe(0)
  })
})

// ─────────────────────────────────────────
// calcDsr — DSR 계산
// ─────────────────────────────────────────

describe("calcDsr", () => {
  test("월납입 120만 / 월소득 300만 → 40%", () => {
    expect(calcDsr(1_200_000, 3_000_000)).toBe(40)
  })

  test("월소득 0 → 0 (나누기 0 방어)", () => {
    expect(calcDsr(500_000, 0)).toBe(0)
  })

  test("납입액 > 소득 → 100% 초과 허용", () => {
    expect(calcDsr(4_000_000, 3_000_000)).toBe(133)
  })

  test("납입액 0 → 0%", () => {
    expect(calcDsr(0, 3_000_000)).toBe(0)
  })
})

// ─────────────────────────────────────────
// calcProgress — 달성률
// ─────────────────────────────────────────

describe("calcProgress", () => {
  test("50만 / 100만 → 50%", () => {
    expect(calcProgress(500_000, 1_000_000)).toBe(50)
  })

  test("초과 달성 → 100% clamp", () => {
    expect(calcProgress(1_500_000, 1_000_000)).toBe(100)
  })

  test("0 / 100만 → 0%", () => {
    expect(calcProgress(0, 1_000_000)).toBe(0)
  })

  test("목표 0 → 0% (나누기 0 방어)", () => {
    expect(calcProgress(500_000, 0)).toBe(0)
  })

  test("음수 목표 → 0%", () => {
    expect(calcProgress(500_000, -1_000_000)).toBe(0)
  })
})

// ─────────────────────────────────────────
// calcSavingBreakdown — 저축 분해
// ─────────────────────────────────────────

describe("calcSavingBreakdown", () => {
  test("정상: 300만 / 30일 플랜", () => {
    const result = calcSavingBreakdown(0, 3_000_000, "2025-01-01", "2025-01-31")
    expect(result).not.toBeNull()
    expect(result!.totalDays).toBe(30)
    expect(result!.daily).toBeGreaterThan(0)
    expect(result!.weekly).toBeGreaterThan(0)
    expect(result!.monthly).toBeGreaterThan(0)
  })

  test("daily × totalDays ≈ remaining (올림 특성상 약간 클 수 있음)", () => {
    const result = calcSavingBreakdown(0, 3_000_000, "2025-01-01", "2025-01-31")
    expect(result!.daily * result!.totalDays).toBeGreaterThanOrEqual(3_000_000)
  })

  test("이미 달성 (baseAsset >= goalAmount) → null", () => {
    expect(calcSavingBreakdown(1_000_000, 1_000_000, "2025-01-01", "2025-12-31")).toBeNull()
  })

  test("초과 달성 (baseAsset > goalAmount) → null", () => {
    expect(calcSavingBreakdown(2_000_000, 1_000_000, "2025-01-01", "2025-12-31")).toBeNull()
  })

  test("날짜 역전 (end < start) → null", () => {
    expect(calcSavingBreakdown(0, 1_000_000, "2025-12-31", "2025-01-01")).toBeNull()
  })

  test("같은 날짜 (totalDays = 0) → null", () => {
    expect(calcSavingBreakdown(0, 1_000_000, "2025-01-01", "2025-01-01")).toBeNull()
  })
})

// ─────────────────────────────────────────
// isOverdue — 기간 초과 여부
// ─────────────────────────────────────────

describe("isOverdue", () => {
  test("과거 날짜 → true", () => {
    expect(isOverdue("2020-01-01")).toBe(true)
  })

  test("미래 날짜 → false", () => {
    expect(isOverdue("2099-01-01")).toBe(false)
  })

  test("null → false", () => {
    expect(isOverdue(null)).toBe(false)
  })

  test("undefined → false", () => {
    expect(isOverdue(undefined)).toBe(false)
  })

  test("빈 문자열 → false", () => {
    expect(isOverdue("")).toBe(false)
  })

  test("잘못된 날짜 문자열 → false (Invalid Date 방어)", () => {
    expect(isOverdue("not-a-date")).toBe(false)
  })
})

// ─────────────────────────────────────────
// calcDday — D-Day 문자열
// ─────────────────────────────────────────

describe("calcDday", () => {
  test("null → 빈 문자열", () => {
    expect(calcDday(null)).toBe("")
  })

  test("undefined → 빈 문자열", () => {
    expect(calcDday(undefined)).toBe("")
  })

  test("미래 날짜 → D-N 형식", () => {
    expect(calcDday("2099-01-01")).toMatch(/^D-\d+$/)
  })

  test("과거 날짜 → 기간 초과", () => {
    expect(calcDday("2020-01-01")).toBe("기간 초과")
  })

  test("잘못된 날짜 → 빈 문자열", () => {
    expect(calcDday("not-a-date")).toBe("")
  })
})

// ─────────────────────────────────────────
// getEulReul — 조사
// ─────────────────────────────────────────

describe("getEulReul", () => {
  test("받침 있는 단어 → 을", () => {
    expect(getEulReul("아메리카노")).toBe("를") // 노 → 받침 없음
    expect(getEulReul("밥")).toBe("을")         // 밥 → 받침 있음
  })

  test("받침 없는 단어 → 를", () => {
    expect(getEulReul("커피")).toBe("를")
  })

  test("빈 문자열 → 기본값 을", () => {
    expect(getEulReul("")).toBe("을")
  })
})

// ─────────────────────────────────────────
// formatCurrency — 원 단위 포맷
// ─────────────────────────────────────────

describe("formatCurrency", () => {
  test("1억 2345만 6000원", () => {
    expect(formatCurrency(123_456_000)).toBe("1억 2345만 6천원")
  })

  test("5000만원", () => {
    expect(formatCurrency(50_000_000)).toBe("5000만원")
  })

  test("300만원", () => {
    expect(formatCurrency(3_000_000)).toBe("300만원")
  })

  test("0 → 0원", () => {
    expect(formatCurrency(0)).toBe("0원")
  })

  test("음수 → 0원", () => {
    expect(formatCurrency(-1_000)).toBe("0원")
  })
})

// ─────────────────────────────────────────
// formatManwon — 만원 단위 포맷
// ─────────────────────────────────────────

describe("formatManwon", () => {
  test("25000만원 → 2억 5,000만원", () => {
    expect(formatManwon(25_000)).toBe("2억 5,000만원")
  })

  test("10000만원 → 1억원 (딱 떨어지는 억)", () => {
    expect(formatManwon(10_000)).toBe("1억원")
  })

  test("500만원", () => {
    expect(formatManwon(500)).toBe("500만원")
  })

  test("0 → 0원", () => {
    expect(formatManwon(0)).toBe("0원")
  })

  test("음수 → 0원", () => {
    expect(formatManwon(-500)).toBe("0원")
  })

  test("60000만원 → 6억원", () => {
    expect(formatManwon(60_000)).toBe("6억원")
  })
})

// ─────────────────────────────────────────
// formatWon — 원 단위 테이블 포맷
// ─────────────────────────────────────────

describe("formatWon", () => {
  test("1,234,567원", () => {
    expect(formatWon(1_234_567)).toBe("1,234,567원")
  })

  test("0원", () => {
    expect(formatWon(0)).toBe("0원")
  })
})
