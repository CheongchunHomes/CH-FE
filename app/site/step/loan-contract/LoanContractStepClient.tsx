"use client"

import { useStepBar } from "@/app/site/step/components/StepLayoutShell"
import { LoanContractFlow } from "@/components/loan/loan-contract-flow"
import type { LoanProductKey } from "@/lib/loan/loan-products"

type LoanContractStepClientProps = {
  initialProductKey: LoanProductKey
}

export function LoanContractStepClient({ initialProductKey }: LoanContractStepClientProps) {
  useStepBar(3)

  return <LoanContractFlow initialProductKey={initialProductKey} />
}
