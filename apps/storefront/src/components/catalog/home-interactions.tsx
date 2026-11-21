"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Icon, Media, number } from "../layout/ui"

export function Hero({
  slides,
}: {
  slides: {
    eyebrow: string
    title: string
    description: string
    href: string
    image?: string
  }[]
}) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const move = (delta: number) =>
    setActive((current) => (current + delta + slides.length) % slides.length)

  useEffect(() => {
    if (
      paused ||
      engaged ||
      slides.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      7000
    )
    return () => window.clearInterval(timer)
  }, [paused, engaged, slides.length])

  const slide = slides[active]
  return (
    <section
      className={`store-hero store-hero-${active}`}
      aria-roledescription="چرخ‌وفلک"
      aria-label="مجموعه‌های آینورا"
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
    >
      <div
        className="store-wrap store-hero-content"
        onFocus={() => setPaused(true)}
      >
        <div className="store-hero-copy">
          <p className="store-overline">{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p>{slide.description}</p>
          <Link className="store-button" href={slide.href}>
            مشاهده مجموعه <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="store-hero-visual">
          <span aria-hidden="true">AINURA</span>
          <Media src={slide.image} alt="" eager={active === 0} />
        </div>
      </div>
      {slides.length > 1 && (
        <div className="store-wrap store-hero-controls">
          <button
            className="store-icon store-outline"
            type="button"
            aria-label="اسلاید قبلی"
            onClick={() => {
              setPaused(true)
              move(-1)
            }}
          >
            <Icon name="right" size={17} />
          </button>
          {slides.map((item, index) => (
            <button
              key={item.title}
              className="store-hero-dot"
              type="button"
              aria-label={`اسلاید ${number(index + 1)}`}
              aria-pressed={active === index}
              onClick={() => {
                setPaused(true)
                setActive(index)
              }}
            />
          ))}
          <button
            className="store-icon store-outline"
            type="button"
            aria-label="اسلاید بعدی"
            onClick={() => {
              setPaused(true)
              move(1)
            }}
          >
            <Icon name="left" size={17} />
          </button>
          <button
            className="store-hero-pause"
            type="button"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "پخش" : "مکث"}
          </button>
        </div>
      )}
    </section>
  )
}

export function Countdown() {
  const [remaining, setRemaining] = useState<number>()
  useEffect(() => {
    const tick = () => {
      const day = 86_400_000
      const tehranOffset = 12_600_000
      setRemaining(
        Math.ceil((day - ((Date.now() + tehranOffset) % day)) / 1000)
      )
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])
  const clock =
    remaining === undefined
      ? "--:--:--"
      : [
          Math.floor(remaining / 3600),
          Math.floor(remaining / 60) % 60,
          remaining % 60,
        ]
          .map((unit) =>
            unit.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })
          )
          .join(":")
  return (
    <div className="store-countdown">
      <span>تا پایان امروز</span>
      <time dir="ltr">{clock}</time>
    </div>
  )
}
