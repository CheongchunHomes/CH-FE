import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "build/**",
      "coverage/**",
      "dist/**",
      "app/live2d/**",
      "components/live2d/**",
      "lib/live2d-local/**",
      "lib/live2d-sdk/**",
      "next-env.d.ts",
      "node_modules/**",
      "public/**",
      "storage/**",
      "templates/**",
    ],
  },
]

export default eslintConfig
