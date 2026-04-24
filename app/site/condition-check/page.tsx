import { PageSampleView } from "@/components/page-sample-view"
import { getPageSample } from "@/lib/page-samples"

export default function ConditionCheckPage() {
  const sample = getPageSample("condition-check")

  if (!sample) {
    return null
  }

  return <PageSampleView image={sample.image} label={sample.label} />
}
