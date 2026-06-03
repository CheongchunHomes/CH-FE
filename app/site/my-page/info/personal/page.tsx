"use client"

import { useEffect, useState } from "react"

import { get, request } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PersonalInfo = {
  realName: string
  phone: string
  address: string
}

export default function MyPagePersonalInfoPage() {
  const [form, setForm] = useState<PersonalInfo>({
    realName: "",
    phone: "",
    address: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let ignore = false

    async function loadPersonalInfo() {
      setIsLoading(true)
      setErrorMessage("")

      try {
        const data = await get<PersonalInfo>("/api/users/personal", {
          cache: "no-store",
          suppressGlobalError: true,
        })

        if (!ignore) {
          setForm({
            realName: data.realName ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
          })
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "개인정보를 불러오지 못했습니다.")
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadPersonalInfo()

    return () => {
      ignore = true
    }
  }, [])

  function updateField(field: keyof PersonalInfo, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSuccessMessage("")
    setErrorMessage("")

    if (!form.realName.trim() || !form.phone.trim() || !form.address.trim()) {
      setErrorMessage("본명, 연락처, 주소를 모두 입력해 주세요.")
      return
    }

    setIsSubmitting(true)

    try {
      await request<unknown, PersonalInfo>("PUT", "/api/users/personal", {
        body: {
          realName: form.realName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
        suppressGlobalError: true,
      })
      setSuccessMessage("개인정보가 저장되었습니다.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "개인정보 저장에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-500">개인 정보</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">개인정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm font-medium text-slate-500">개인정보를 불러오는 중입니다.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="my-page-real-name">본명</Label>
                <Input
                  id="my-page-real-name"
                  value={form.realName}
                  onChange={(event) => updateField("realName", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="my-page-phone">연락처</Label>
                <Input
                  id="my-page-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="my-page-address">주소</Label>
                <Input
                  id="my-page-address"
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                />
              </div>

              {successMessage ? <p className="text-sm font-medium text-sky-700">{successMessage}</p> : null}
              {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

              <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-sky-600 text-white hover:bg-sky-700">
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
