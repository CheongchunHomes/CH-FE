"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, Home } from "lucide-react";

const SIDEBAR_MENUS = [
  {
    label: "공공임대주택",
    children: [{ label: "모집공고", path: "/site/guide-center" }],
  },
  {
    label: "공공분양주택",
    children: [{ label: "모집공고", path: "/site/guide-center" }],
  },
];

export function AnnouncementSidebar() {
  const router = useRouter();

  return (
    <aside className="w-48 border-r border-gray-200 px-3 py-6 shrink-0">
      <div className="flex flex-col items-center mb-5">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-1">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-800">청년공고찾기</span>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        {SIDEBAR_MENUS.map((menu) => (
          <div key={menu.label}>
            <div className="flex items-center justify-between px-2 py-2 font-semibold text-gray-700">
              <span>{menu.label}</span>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </div>

            {menu.children.map((child) => (
              <button
                key={child.label}
                onClick={() => router.push(child.path)}
                className="w-full text-left px-4 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                · {child.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}