"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Icon } from "./ui"

export function Footer() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const isHome = pathname === "/"

  return (
    <footer className="ds-footer">
      <div className="ds-footer-top">
        <Link href="/" aria-label="دیجی‌استایل">
          <img
            src="/digistyle/logo.svg"
            alt="DIGISTYLE"
            width={195}
            height={24}
          />
        </Link>

        <div className="ds-footer-support">
          <p className="ds-footer-support-text">
            ۷ روز هفته، ۲۴ ساعته پاسخگوی شما هستیم
          </p>
          <div className="ds-footer-vsep" />
          <div className="ds-footer-phone-wrap">
            <span>تلفن پشتیبانی:</span>
            <a href="tel:02161930300" className="ds-footer-phone" dir="ltr">
              ۰۲۱-۶۱۹۳۰۳۰۰
            </a>
          </div>
          <span className="ds-footer-support-icon" aria-hidden="true">
            <Icon name="shield" size={18} />
          </span>
        </div>
      </div>

      {isHome && (
        <div className="ds-footer-about">
          <div className="ds-footer-about-copy">
            <h2>فروشگاه اینترنتی مد و لباس دیجی‌استایل</h2>
            <p data-clamped={expanded ? undefined : "true"}>
              پس از تجربه‌ی موفق فروشگاه اینترنتی دیجی‌کالا به صورت تخصصی پا به
              عرصه مد، پوشاک و سبک زندگی گذاشت تا همان تجربه‌ی شیرین، در قالبی
              نو تکرار شود. در دیجی‌استایل، می‌توانید همه آنچه مرتبط با مد و
              پوشاک است؛ از انواع لباس، کیف و کفش تا محصولات آرایشی و بهداشتی،
              لوازم خانه و اکسسوری‌هایی مانند ساعت مچی و عینک آفتابی را با تخفیف
              ویژه در حراج‌ها پیدا کنید و به سادگی یک ست کامل از جدیدترین برندهای
              معتبر ایرانی و خارجی را بخرید.
            </p>
            <button
              type="button"
              className="ds-footer-more-btn"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "مشاهده کمتر" : "مشاهده بیشتر"}
              <Icon name="left" size={14} />
            </button>
          </div>

          <div className="ds-footer-seals">
            <div className="ds-footer-seal">
              <img src="/digistyle/rezi.png" alt="نشان ملی ثبت" />
            </div>
            <div className="ds-footer-seal">
              <img
                src="/digistyle/kasbokar.png"
                alt="نماد کسب و کارهای مجازی"
              />
            </div>
            <div className="ds-footer-seal">
              <img src="/digistyle/enamad.png" alt="نماد اعتماد الکترونیک" />
            </div>
          </div>
        </div>
      )}

      <div className="ds-footer-bottom">
        <p>
          کلیه حقوق این سایت متعلق به شرکت نوآوران فن آوازه (فروشگاه اینترنتی
          دیجی‌استایل) می‌باشد.
        </p>
        <p dir="ltr">digistyle.com - 2026 © Copyright</p>
      </div>
    </footer>
  )
}
