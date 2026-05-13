"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type FilterType =
  | "deal"
  | "roomSize"
  | "approvalDate"
  | "floor"
  | "extra";

type MapFilterDropdownProps = {
  activeFilter: FilterType;
};

type FilterChipProps = {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

function FilterChip({ children, active = false, onClick }: FilterChipProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "secondary"}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500"
      }`}
    >
      {children}
    </Button>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onUnlimited,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  onUnlimited: () => void;
}) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{label}</p>

        <button
          type="button"
          onClick={onUnlimited}
          className="text-sm font-semibold text-blue-600"
        >
          무제한
        </button>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-blue-600"
      />

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>최소</span>
        <span className="font-medium text-slate-500">
          {value.toLocaleString()}
          {unit}
        </span>
        <span>최대</span>
      </div>
    </div>
  );
}

function DealFilterContent() {
  const [dealTypes, setDealTypes] = useState<string[]>(["월세", "전세"]);
  const [shortRentOnly, setShortRentOnly] = useState(false);
  const [includeMaintenance, setIncludeMaintenance] = useState(false);
  const [deposit, setDeposit] = useState(12000);
  const [monthlyRent, setMonthlyRent] = useState(60);

  const toggleDealType = (type: string) => {
    setDealTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const resetDealFilter = () => {
    setDealTypes(["월세", "전세"]);
    setShortRentOnly(false);
    setIncludeMaintenance(false);
    setDeposit(12000);
    setMonthlyRent(60);
  };

  return (
    <div className="w-[520px]">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">거래유형</h3>
          <span className="text-xs text-slate-400">중복선택 가능</span>
        </div>

        <div className="flex gap-2">
          <FilterChip
            active={dealTypes.includes("월세")}
            onClick={() => toggleDealType("월세")}
          >
            월세
          </FilterChip>

          <FilterChip
            active={dealTypes.includes("전세")}
            onClick={() => toggleDealType("전세")}
          >
            전세
          </FilterChip>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <Checkbox
            checked={shortRentOnly}
            onCheckedChange={(checked) => setShortRentOnly(checked === true)}
          />
          단기월세만 보기
        </label>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">가격</h3>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={includeMaintenance}
              onCheckedChange={(checked) =>
                setIncludeMaintenance(checked === true)
              }
            />
            관리비 포함
          </label>
        </div>

        <RangeControl
          label="보증금(전세금)"
          value={deposit}
          min={0}
          max={30000}
          step={500}
          unit="만원"
          onChange={setDeposit}
          onUnlimited={() => setDeposit(30000)}
        />

        <RangeControl
          label="월세"
          value={monthlyRent}
          min={0}
          max={300}
          step={5}
          unit="만원"
          onChange={setMonthlyRent}
          onUnlimited={() => setMonthlyRent(300)}
        />

        <div className="mt-7 flex justify-end">
          <Button type="button" variant="outline" onClick={resetDealFilter}>
            조건삭제
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoomSizeFilterContent() {
  const [roomSize, setRoomSize] = useState(30);

  return (
    <div className="w-[520px]">
      <div className="mb-5 flex items-center gap-2">
        <h3 className="text-base font-bold text-slate-900">방크기</h3>
        <span className="text-xs text-slate-400">매물유형별 기준면적</span>
      </div>

      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setRoomSize(60)}
          className="text-sm font-semibold text-blue-600"
        >
          전체
        </button>
      </div>

      <input
        type="range"
        min={10}
        max={60}
        step={5}
        value={roomSize}
        onChange={(e) => setRoomSize(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-blue-600"
      />

      <div className="mt-2 flex justify-between text-sm text-slate-400">
        <span>10평 미만</span>
        <span className="font-medium text-slate-500">{roomSize}평</span>
        <span>60평 이상</span>
      </div>
    </div>
  );
}

function ApprovalDateFilterContent() {
  const [selectedApprovalDate, setSelectedApprovalDate] = useState("전체");

  const options = ["전체", "5년 이내", "10년 이내", "15년 이내", "15년 이상"];

  return (
    <div className="w-[520px]">
      <h3 className="mb-5 text-base font-bold text-slate-900">사용승인일</h3>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option}
            active={selectedApprovalDate === option}
            onClick={() => setSelectedApprovalDate(option)}
          >
            {option}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FloorFilterContent() {
  const [selectedFloors, setSelectedFloors] = useState<string[]>([
    "1층",
    "2층이상",
    "반지하",
    "옥탑",
  ]);

  const floorOptions = ["1층", "2층이상", "반지하", "옥탑"];

  const toggleFloor = (floor: string) => {
    setSelectedFloors((prev) =>
      prev.includes(floor)
        ? prev.filter((item) => item !== floor)
        : [...prev, floor]
    );
  };

  return (
    <div className="w-[520px]">
      <div className="mb-5 flex items-center gap-2">
        <h3 className="text-base font-bold text-slate-900">층수</h3>
        <span className="text-xs text-slate-400">중복선택 가능</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {floorOptions.map((floor) => (
          <FilterChip
            key={floor}
            active={selectedFloors.includes(floor)}
            onClick={() => toggleFloor(floor)}
          >
            {floor}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function ExtraFilterContent() {
  const [selectedExtraOptions, setSelectedExtraOptions] = useState<string[]>([]);
  const [selectedRoomStructures, setSelectedRoomStructures] = useState<
    string[]
  >(["원룸", "투룸"]);

  const extraOptions = ["주차가능", "엘리베이터", "360°VR", "분리형", "복층"];
  const roomStructureOptions = ["원룸", "투룸"];

  const toggleExtraOption = (option: string) => {
    setSelectedExtraOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const toggleRoomStructure = (option: string) => {
    setSelectedRoomStructures((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="w-[520px]">
      <div className="mb-7">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">추가필터</h3>
          <span className="text-xs text-slate-400">중복선택 가능</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {extraOptions.map((option) => (
            <FilterChip
              key={option}
              active={selectedExtraOptions.includes(option)}
              onClick={() => toggleExtraOption(option)}
            >
              {option}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">방구조</h3>
          <span className="text-xs text-slate-400">중복선택 가능</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {roomStructureOptions.map((option) => (
            <FilterChip
              key={option}
              active={selectedRoomStructures.includes(option)}
              onClick={() => toggleRoomStructure(option)}
            >
              {option}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MapFilterDropdown({
  activeFilter,
}: MapFilterDropdownProps) {
  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      {activeFilter === "deal" && <DealFilterContent />}
      {activeFilter === "roomSize" && <RoomSizeFilterContent />}
      {activeFilter === "approvalDate" && <ApprovalDateFilterContent />}
      {activeFilter === "floor" && <FloorFilterContent />}
      {activeFilter === "extra" && <ExtraFilterContent />}
    </div>
  );
}