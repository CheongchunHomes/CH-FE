import KakaoMap from "@/components/map/kakaoMap";
import MapFilterBar from "@/components/map/mapFilterBar";
import MapSidebar from "@/components/map/mapSiderbar";

export default function MapPage() {
  return (
    <main className="h-[calc(100vh-72px)] overflow-hidden bg-slate-50">
      <div className="flex h-full">
        <MapSidebar />

        <section className="relative flex-1">
          <MapFilterBar />

          <div className="h-full w-full">
            <KakaoMap />
          </div>
        </section>
      </div>
    </main>
  );
}