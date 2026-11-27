import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { Icon } from "@/components/layout/ui"
import styles from "./profile.module.css"

export type ProfileIcon = ComponentProps<typeof Icon>["name"]

export function ProfilePanel({
  title,
  action,
  children,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={styles.panel}>
      {title && (
        <div className={styles.panelHeader}>
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function ProfileLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link className={styles.textLink} href={href}>
      {children}
      <Icon name="left" size={16} />
    </Link>
  )
}

export function ProfileEmpty({
  icon,
  title,
  children,
}: {
  icon: ProfileIcon
  title: string
  children?: ReactNode
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <Icon name={icon} size={28} />
      </span>
      <p>{title}</p>
      {children}
    </div>
  )
}

export function ProfileLoad({
  status,
  retry,
}: {
  status: "loading" | "error"
  retry: () => void
}) {
  if (status === "loading")
    return (
      <p className={styles.message} role="status">
        در حال بارگذاری…
      </p>
    )

  return (
    <div className={styles.message}>
      <p role="alert">دریافت اطلاعات ممکن نشد.</p>
      <button type="button" className={styles.secondary} onClick={retry}>
        تلاش دوباره
      </button>
    </div>
  )
}
