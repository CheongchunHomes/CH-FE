"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type {
  ApprovalDateFilter,
  AreaFilter,
  FloorFilter,
  MapDealType,
  MapFilterState,
} from "@/lib/map/map-types";

type FilterMenuType =
  | "rent"
  | "roomSize"
  | "approvalDate"
  | "floor"
  | "extra"
  | null;

type MapFilterBarProps = {
  filters: MapFilterState;
  onChangeFilters: (filters: MapFilterState) => void;
  onResetFilters: () => void;
};

const FILTER_BUTTONS: {
  key: Exclude<FilterMenuType, null>;
  label: string;
}[] = [
  { key: "rent", label: "월세, 전체" },
  { key: "roomSize", label: "방크기" },
  { key: "approvalDate", label: "사용승인일" },
  { key: "floor", label: "층수" },
  { key: "extra", label: "추가필터" },
];

const DEAL_TYPE_OPTIONS: { label: string; value: MapDealType }[] = [
  { label: "전체", value: "all" },
  { label: "월세", value: "monthly" },
  { label: "전세", value: "jeonse" },
];

const DEPOSIT_OPTIONS: { label: string; value: number | null }[] = [
  { label: "전체", value: null },
  { label: "500만 이하", value: 500 },
  { label: "1천만 이하", value: 1000 },
  { label: "3천만 이하", value: 3000 },
  { label: "5천만 이하", value: 5000 },
  { label: "1억 이하", value: 10000 },
  { label: "3억 이하", value: 30000 },
];

const MONTHLY_RENT_OPTIONS: { label: string; value: number | null }[] = [
  { label: "전체", value: null },
  { label: "40만 이하", value: 40 },
  { label: "60만 이하", value: 60 },
  { label: "80만 이하", value: 80 },
  { label: "100만 이하", value: 100 },
];

const MAINTENANCE_FEE_OPTIONS: { label: string; value: number | null }[] = [
  { label: "전체", value: null },
  { label: "5만 이하", value: 5 },
  { label: "10만 이하", value: 10 },
  { label: "15만 이하", value: 15 },
  { label: "20만 이하", value: 20 },
];

const AREA_OPTIONS: { label: string; value: AreaFilter }[] = [
  { label: "전체", value: "all" },
  { label: "10㎡ 이하", value: "under10" },
  { label: "10~20㎡", value: "10to20" },
  { label: "20~30㎡", value: "20to30" },
  { label: "30~40㎡", value: "30to40" },
  { label: "40㎡ 이상", value: "over40" },
];

const APPROVAL_DATE_OPTIONS: { label: string; value: ApprovalDateFilter }[] = [
  { label: "전체", value: "all" },
  { label: "5년 이내", value: "under5y" },
  { label: "10년 이내", value: "under10y" },
  { label: "15년 이내", value: "under15y" },
  { label: "20년 이상", value: "over20y" },
];

const FLOOR_OPTIONS: { label: string; value: FloorFilter }[] = [
  { label: "전체", value: "all" },
  { label: "1층", value: "first" },
  { label: "저층", value: "low" },
  { label: "중층", value: "middle" },
  { label: "고층", value: "high" },
];

const ELEVATOR_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: "전체", value: null },
  { label: "엘리베이터 있음", value: true },
  { label: "엘리베이터 없음", value: false },
];

const PARKING_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: "전체", value: null },
  { label: "주차 가능", value: true },
  { label: "주차 불가", value: false },
];

const TAG_OPTIONS = [
  "청년",
  "역세권",
  "원룸",
  "투룸",
  "빌라",
  "오피스텔",
  "신축",
];

const OPTION_OPTIONS = [
  "침대",
  "냉장고",
  "세탁기",
  "에어컨",
  "인덕션",
  "TV",
  "책상",
  "옷장",
];

export default function MapFilterBar({
  filters,
  onChangeFilters,
  onResetFilters,
}: MapFilterBarProps) {
  const [openMenu, setOpenMenu] = useState<FilterMenuType>(null);

  // 필터 메뉴를 열거나 닫습니다.
  const toggleMenu = (menu: Exclude<FilterMenuType, null>) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  // 태그를 선택하거나 해제합니다.
  const toggleTag = (tag: string) => {
    const nextTags = filters.tags.includes(tag)
      ? filters.tags.filter((item) => item !== tag)
      : [...filters.tags, tag];

    onChangeFilters({ ...filters, tags: nextTags });
  };

  // 옵션을 선택하거나 해제합니다.
  const toggleOption = (option: string) => {
    const nextOptions = filters.options.includes(option)
      ? filters.options.filter((item) => item !== option)
      : [...filters.options, option];

    onChangeFilters({ ...filters, options: nextOptions });
  };

  return (
    <div className="relative z-10 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4">
      {/* 상단 필터 버튼 목록입니다. */}
      {FILTER_BUTTONS.map((button) => (
        <FilterButton
          key={button.key}
          label={getFilterButtonLabel(button.key, filters)}
          isOpen={openMenu === button.key}
          onClick={() => toggleMenu(button.key)}
        />
      ))}

      {/* 전체 필터를 기본값으로 되돌립니다. */}
      <button
        type="button"
        onClick={() => {
          onResetFilters();
          setOpenMenu(null);
        }}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        ↻
      </button>

      {/* 선택한 필터 메뉴의 드롭다운을 표시합니다. */}
      {openMenu && (
        <FilterDropdown
          menu={openMenu}
          filters={filters}
          onClose={() => setOpenMenu(null)}
          onChangeFilters={onChangeFilters}
          onResetFilters={onResetFilters}
          onToggleTag={toggleTag}
          onToggleOption={toggleOption}
        />
      )}
    </div>
  );
}

type FilterButtonProps = {
  label: string;
  isOpen: boolean;
  onClick: () => void;
};

function FilterButton({ label, isOpen, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50",
        isOpen
          ? "border-blue-500 bg-blue-50 text-blue-600"
          : "border-slate-200 bg-white text-slate-700",
      ].join(" ")}
    >
      {label}
      <span className="ml-2 text-xs">{isOpen ? "⌃" : "⌄"}</span>
    </button>
  );
}

type FilterDropdownProps = {
  menu: Exclude<FilterMenuType, null>;
  filters: MapFilterState;
  onClose: () => void;
  onChangeFilters: (filters: MapFilterState) => void;
  onResetFilters: () => void;
  onToggleTag: (tag: string) => void;
  onToggleOption: (option: string) => void;
};

function FilterDropdown({
  menu,
  filters,
  onClose,
  onChangeFilters,
  onResetFilters,
  onToggleTag,
  onToggleOption,
}: FilterDropdownProps) {
  return (
    <div className="absolute left-4 top-14 z-30 max-h-[calc(100vh-120px)] w-[600px] overflow-y-auto rounded-b-2xl border border-slate-200 bg-white p-5 shadow-xl">
      {/* 거래유형, 보증금, 월세를 설정합니다. */}
      {menu === "rent" && (
        <div className="space-y-4">
          <FilterSection title="거래유형">
            {DEAL_TYPE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                isActive={filters.dealType === option.value}
                onClick={() =>
                  onChangeFilters({ ...filters, dealType: option.value })
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="보증금">
            {DEPOSIT_OPTIONS.map((option) => (
              <OptionButton
                key={option.label}
                label={option.label}
                isActive={filters.maxDeposit === option.value}
                onClick={() =>
                  onChangeFilters({ ...filters, maxDeposit: option.value })
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="월세">
            {MONTHLY_RENT_OPTIONS.map((option) => (
              <OptionButton
                key={option.label}
                label={option.label}
                isActive={filters.maxMonthlyRent === option.value}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    maxMonthlyRent: option.value,
                  })
                }
              />
            ))}
          </FilterSection>
        </div>
      )}

      {/* 전용면적 기준으로 방크기를 설정합니다. */}
      {menu === "roomSize" && (
        <div className="space-y-4">
          <FilterSection title="방크기">
            {AREA_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                isActive={filters.area === option.value}
                onClick={() =>
                  onChangeFilters({ ...filters, area: option.value })
                }
              />
            ))}
          </FilterSection>
        </div>
      )}

      {/* 사용승인일 기준으로 건물 연식을 설정합니다. */}
      {menu === "approvalDate" && (
        <div className="space-y-4">
          <FilterSection title="사용승인일">
            {APPROVAL_DATE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                isActive={filters.approvalDate === option.value}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    approvalDate: option.value,
                  })
                }
              />
            ))}
          </FilterSection>
        </div>
      )}

      {/* 층수 조건을 설정합니다. */}
      {menu === "floor" && (
        <div className="space-y-4">
          <FilterSection title="층수">
            {FLOOR_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                isActive={filters.floor === option.value}
                onClick={() =>
                  onChangeFilters({ ...filters, floor: option.value })
                }
              />
            ))}
          </FilterSection>
        </div>
      )}

      {/* 추가 조건을 설정합니다. */}
      {menu === "extra" && (
        <div className="space-y-5">
          <FilterSection title="관리비">
            {MAINTENANCE_FEE_OPTIONS.map((option) => (
              <OptionButton
                key={option.label}
                label={option.label}
                isActive={filters.maxMaintenanceFee === option.value}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    maxMaintenanceFee: option.value,
                  })
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="엘리베이터">
            {ELEVATOR_OPTIONS.map((option) => (
              <OptionButton
                key={option.label}
                label={option.label}
                isActive={filters.elevatorAvailable === option.value}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    elevatorAvailable: option.value,
                  })
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="주차">
            {PARKING_OPTIONS.map((option) => (
              <OptionButton
                key={option.label}
                label={option.label}
                isActive={filters.parkingAvailable === option.value}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    parkingAvailable: option.value,
                  })
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="옵션">
            {OPTION_OPTIONS.map((option) => (
              <OptionButton
                key={option}
                label={option}
                isActive={filters.options.includes(option)}
                onClick={() => onToggleOption(option)}
              />
            ))}
          </FilterSection>

          <FilterSection title="태그">
            {TAG_OPTIONS.map((tag) => (
              <OptionButton
                key={tag}
                label={tag}
                isActive={filters.tags.includes(tag)}
                onClick={() => onToggleTag(tag)}
              />
            ))}
          </FilterSection>
        </div>
      )}

      {/* 드롭다운 하단의 공통 액션 버튼입니다. */}
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => {
            onResetFilters();
            onClose();
          }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          초기화
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          적용하기
        </button>
      </div>
    </div>
  );
}

type FilterSectionProps = {
  title: string;
  children: ReactNode;
};

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-bold text-slate-800">{title}</h4>
      <div className="grid grid-cols-4 gap-2">{children}</div>
    </div>
  );
}

type OptionButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function OptionButton({ label, isActive, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600",
        isActive
          ? "border-blue-500 bg-blue-50 text-blue-600"
          : "border-slate-200 bg-white text-slate-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function getFilterButtonLabel(
  menu: Exclude<FilterMenuType, null>,
  filters: MapFilterState
) {
  switch (menu) {
    case "rent":
      return getRentButtonLabel(filters);
    case "roomSize":
      return getAreaLabel(filters.area);
    case "approvalDate":
      return getApprovalDateLabel(filters.approvalDate);
    case "floor":
      return getFloorLabel(filters.floor);
    case "extra":
      return getExtraFilterLabel(filters);
    default:
      return "필터";
  }
}

function getRentButtonLabel(filters: MapFilterState) {
  const dealLabel = getDealTypeLabel(filters.dealType);

  if (filters.maxDeposit === null && filters.maxMonthlyRent === null) {
    return `${dealLabel}, 전체`;
  }

  if (filters.maxDeposit !== null && filters.maxMonthlyRent !== null) {
    return `${dealLabel}, 보증금 ${filters.maxDeposit}만 이하`;
  }

  if (filters.maxDeposit !== null) {
    return `${dealLabel}, 보증금 ${filters.maxDeposit}만 이하`;
  }

  if (filters.maxMonthlyRent !== null) {
    return `${dealLabel}, 월세 ${filters.maxMonthlyRent}만 이하`;
  }

  return `${dealLabel}, 전체`;
}

function getDealTypeLabel(value: MapDealType) {
  switch (value) {
    case "monthly":
      return "월세";
    case "jeonse":
      return "전세";
    default:
      return "월세";
  }
}

function getAreaLabel(value: AreaFilter) {
  switch (value) {
    case "under10":
      return "10㎡ 이하";
    case "10to20":
      return "10~20㎡";
    case "20to30":
      return "20~30㎡";
    case "30to40":
      return "30~40㎡";
    case "over40":
      return "40㎡ 이상";
    default:
      return "방크기";
  }
}

function getApprovalDateLabel(value: ApprovalDateFilter) {
  switch (value) {
    case "under5y":
      return "5년 이내";
    case "under10y":
      return "10년 이내";
    case "under15y":
      return "15년 이내";
    case "over20y":
      return "20년 이상";
    default:
      return "사용승인일";
  }
}

function getFloorLabel(value: FloorFilter) {
  switch (value) {
    case "first":
      return "1층";
    case "low":
      return "저층";
    case "middle":
      return "중층";
    case "high":
      return "고층";
    default:
      return "층수";
  }
}

function getExtraFilterLabel(filters: MapFilterState) {
  const count =
    (filters.maxMaintenanceFee !== null ? 1 : 0) +
    (filters.elevatorAvailable !== null ? 1 : 0) +
    (filters.parkingAvailable !== null ? 1 : 0) +
    filters.options.length +
    filters.tags.length;

  return count > 0 ? `추가필터 ${count}` : "추가필터";
}