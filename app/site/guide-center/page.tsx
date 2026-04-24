import { PageSampleView } from "@/components/page-sample-view"
import { getPageSample, getPageSampleHref } from "@/lib/page-samples"

export default function GuideCenterPage() {
  const sample = getPageSample("guide-center")

  if (!sample) {
    return null
  }

  return <PageSampleView image={sample.image} label={sample.label} href={getPageSampleHref("notice")} />
}
