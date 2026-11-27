import { useEffect, useState } from "react"

type Resource<T> =
  { status: "loading" } | { status: "error" } | { status: "ready"; data: T }

export function useProfileResource<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Resource<T>>({ status: "loading" })

  useEffect(() => {
    let active = true
    load().then(
      (data) => {
        if (active) setResult({ status: "ready", data })
      },
      () => {
        if (active) setResult({ status: "error" })
      }
    )
    return () => {
      active = false
    }
  }, [load, attempt])

  const retry = () => {
    setResult({ status: "loading" })
    setAttempt((current) => current + 1)
  }

  return { ...result, retry }
}
