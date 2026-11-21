import Link from "next/link"
import { Icon } from "./ui"

export function Footer() {
  return (
    <footer className="store-footer">
      <div className="store-wrap">
        <div className="store-footer-main">
          <div>
            <Link className="store-wordmark" href="/">
              <strong>آینورا</strong>
              <small lang="en" dir="ltr">
                AINURA
              </small>
            </Link>
            <p>مد، پوشاک و چرم؛ برای استایلی که به شما می‌آید.</p>
          </div>
          <nav aria-label="پیوندهای فروشگاه">
            <h2>فروشگاه</h2>
            <Link href="/products">همه محصولات</Link>
            <Link href="/products?sort=new">تازه‌رسیده‌ها</Link>
            <Link href="/products?sale=1">فروش ویژه</Link>
          </nav>
          <nav aria-label="پیوندهای حساب">
            <h2>حساب من</h2>
            <Link href="/account">حساب کاربری</Link>
            <Link href="/wishlist">علاقه‌مندی‌ها</Link>
            <Link href="/cart">سبد خرید</Link>
          </nav>
          <div className="store-footer-promises">
            <span>
              <Icon name="shield" /> تضمین اصالت کالا
            </span>
            <span>
              <Icon name="truck" /> ارسال سفارش
            </span>
          </div>
        </div>
        <div className="store-footer-end">تمام حقوق برای آینورا محفوظ است.</div>
      </div>
    </footer>
  )
}
