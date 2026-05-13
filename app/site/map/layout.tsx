type MapLayoutProps = {
  children: React.ReactNode;
};

export default function MapLayout({ children }: MapLayoutProps) {
  return (
    // 지도 화면은 브라우저 높이에 맞춰 고정합니다.
    <div className="h-[calc(100vh-73px)] w-full overflow-hidden bg-white">
      {children}
    </div>
  );
}
