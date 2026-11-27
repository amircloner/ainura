"use client"

import Link from "next/link"
import { useEffect, useRef, type ReactNode } from "react"

export const number = (value: number) => value.toLocaleString("fa-IR")
export const price = (value: number) => `${number(value)} تومان`

const paths = {
  search: "M21 21l-4-4m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
  bag: "M4 7h16l1 14H3L4 7Zm4 3V6a4 4 0 0 1 8 0v4",
  cart: "M22 3h-2l-1 13H4L3 6h17M6 20h1m9 0h1",
  login: "M16 7V4H3v16h13v-3m7-5H8m4-4-4 4 4 4",
  user: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "m6 6 12 12M18 6 6 18",
  left: "m14 5-7 7 7 7",
  right: "m10 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  arrow: "M21 12H3m7-7-7 7 7 7",
  filter: "M4 7h16M4 17h16m-11-3v6m6-16v6",
  share: "M12 16V3m-5 5 5-5 5 5M5 12v9h14v-9",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  check: "m5 12 4 4L19 6",
  shield: "M12 22s7-4 7-10V5l-7-3-7 3v7c0 6 7 10 7 10Zm-3-10 2 2 4-4",
  truck: "M3 5h12v12H3V5Zm12 5h4l3 3v4h-7m-9 0a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0",
  ruler: "M3 14 14 3l7 7-11 11-7-7Zm5-5 3 3m1-7 3 3m-11 5 3 3",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  box: "M3 7 12 3l9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v10M7.5 5l9 4",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Zm-4.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  message: "M20 4H4v13h4v4l5-4h7V4ZM8 9h8m-8 4h5",
  gift: "M3 8h18v4H3zM5 12v9h14v-9m-7-4v13m0-13H8a2.5 2.5 0 1 1 2.3-3.4L12 8Zm0 0h4a2.5 2.5 0 1 0-2.3-3.4L12 8Z",
  wallet: "M20 8V5H5a2 2 0 0 0-2 2v12h17v-4m-3-4h4v4h-4a2 2 0 0 1 0-4ZM5 8h15",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  return: "M9 8 4 12l5 4m-5-4h11a5 5 0 0 0 0-10",
  plus: "M12 5v14M5 12h14",
} as const

export function Icon({
  name,
  size = 20,
}: {
  name: keyof typeof paths
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export function Modal({
  label,
  onClose,
  children,
  className = "",
}: {
  label: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`store-modal ${className}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="store-modal-inner">
        <div className="store-modal-heading">
          <h2>{label}</h2>
          <button
            type="button"
            className="store-icon"
            aria-label="بستن"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function Media({
  src,
  alt,
  eager = false,
}: {
  src?: string | null
  alt: string
  eager?: boolean
}) {
  return (
    <span className="store-media">
      <span className="store-media-placeholder" aria-hidden="true">
        <Icon name="bag" size={30} />
      </span>
      {src && (
        <img
          key={src}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      )}
    </span>
  )
}

export function Breadcrumbs({
  items,
  homeLabel = "خانه",
}: {
  items: { label: string; href?: string }[]
  homeLabel?: string
}) {
  return (
    <nav className="store-breadcrumbs" aria-label="مسیر صفحه">
      <Link href="/">{homeLabel}</Link>
      {items.map(({ label, href }, index) => (
        <span key={index}>
          <Icon name="left" size={12} />
          {href ? (
            <Link href={href}>{label}</Link>
          ) : (
            <span aria-current="page">{label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
