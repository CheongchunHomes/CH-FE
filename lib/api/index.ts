// 호출부에서는 이 파일만 import 하도록 모아둔 진입점입니다.
// 예: import { get, post, ApiError } from "@/lib/api"
export { ApiError, get, post, request } from "@/lib/api/client"
export type { ApiMethod, ApiRequestOptions } from "@/lib/api/client"
