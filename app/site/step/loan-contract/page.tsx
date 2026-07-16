import { redirect } from "next/navigation"

import { resolveLoanProductKey } from "@/lib/loan/loan-products"

import { LoanContractStepClient } from "./LoanContractStepClient"

type LoanContractPageProps = {
  searchParams?: {
    product?: string | string[]
  }
}

export default function LoanContractPage({ searchParams }: LoanContractPageProps) {
  const rawProduct = Array.isArray(searchParams?.product) ? searchParams?.product[0] : searchParams?.product

  if (!rawProduct) {
    redirect("/site/loan")
  }

  return <LoanContractStepClient initialProductKey={resolveLoanProductKey(rawProduct)} />
}
