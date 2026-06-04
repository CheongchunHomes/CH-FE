import { redirect } from "next/navigation"
import { LoanContractFlow } from "@/components/loan/loan-contract-flow"
import { resolveLoanProductKey } from "@/lib/loan/loan-products"

type LoanContractPageProps = {
  searchParams?: {
    product?: string | string[]
  }
}

export default function LoanContractPage({ searchParams }: LoanContractPageProps) {
  const rawProduct = Array.isArray(searchParams?.product) ? searchParams?.product[0] : searchParams?.product
  if (rawProduct) {
    return <LoanContractFlow initialProductKey={resolveLoanProductKey(rawProduct)} />
  }

  redirect("/site/loan")
}
