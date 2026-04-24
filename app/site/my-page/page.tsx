import { PageSampleView } from "@/components/page-sample-view"
import { getPageSample } from "@/lib/page-samples"

export default function MyPageSamplePage() {
  const sample = getPageSample("my-page")

  if (!sample) {
    return null
  }

  return <PageSampleView image={sample.image} label={sample.label} />
}
