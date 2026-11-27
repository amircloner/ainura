"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { STATIC_MEGA_MENU } from "./static-nav"
import type { CatalogBrand, CatalogProduct } from "@/lib/medusa"
import { categoriesFrom, matchesProduct, matchesText } from "../catalog/catalog"
import { Icon, Media, Modal, number } from "./ui"

export function Header({
  products,
  brands,
}: {
  products: CatalogProduct[]
  brands: CatalogBrand[]
}) {
  const { cart, customer, wishlist, openCart } = useCommerce()
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isPdp = /^\/products?\/[^/]+\/?$/.test(pathname)

  const categories = categoriesFrom(products)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const activeMenu = STATIC_MEGA_MENU.find((m) => m.id === activeMenuId)

  const suggestions = query.trim()
    ? products.filter((product) => matchesProduct(product, query)).slice(0, 6)
    : []
  const matchingCategories = query.trim()
    ? categories
        .filter((category) =>
          matchesText(query, category.name, category.handle)
        )
        .slice(0, 5)
    : []
  const matchingBrands = query.trim()
    ? brands
        .filter((brand) => matchesText(query, brand.name, brand.handle))
        .slice(0, 5)
    : []

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenuId(null)
        setMobileNav(false)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearch(true)
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setActiveMenuId(null)
        setMobileNav(false)
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer)
    }
  }, [])

  function closeAll() {
    setActiveMenuId(null)
    setMobileNav(false)
    setSearch(false)
  }

  const categoryButtons = STATIC_MEGA_MENU.map((item) => (
    <button
      key={item.id}
      type="button"
      className="ds-nav-tab"
      aria-expanded={activeMenuId === item.id}
      onMouseEnter={() => setActiveMenuId(item.id)}
      onClick={() =>
        setActiveMenuId((cur) => (cur === item.id ? null : item.id))
      }
    >
      {item.title}
    </button>
  ))

  return (
    <header
      className={isPdp ? "ds-header ds-header-pdp" : "ds-header"}
      ref={headerRef}
      onMouseLeave={() => setActiveMenuId(null)}
    >
      {isPdp && <div className="ds-pdp-masthead">فروشگاه دیجی‌استایل</div>}
      <div className="ds-header-inner">
        <div className="ds-header-start">
          <button
            className="ds-icon-btn ds-mobile-trigger"
            type="button"
            aria-label="منو"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            <Icon name="menu" size={22} />
          </button>

          <Link
            className="ds-logo-link"
            href="/"
            onClick={closeAll}
            aria-label="دیجی‌استایل"
          >
            <img
              src="/digistyle/logo.svg"
              alt="DIGISTYLE"
              width={146}
              height={24}
            />
          </Link>

          {isPdp ? (
            <nav className="ds-nav-tabs" aria-label="استایل‌ها">
              <Link
                href="/products"
                className="ds-nav-tab"
                data-active="true"
                onClick={closeAll}
              >
                همه استایل‌ها
              </Link>
              {STATIC_MEGA_MENU.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="ds-nav-tab"
                  onClick={closeAll}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="ds-nav-tabs" aria-label="دسته‌بندی‌های دیجی‌استایل">
              {categoryButtons}
              <Link
                href="/landings/jackets"
                className="ds-nav-tab"
                data-active={
                  pathname === "/landings/jackets" ? "true" : undefined
                }
                onMouseEnter={() => setActiveMenuId(null)}
                onClick={closeAll}
              >
                کاپشن و پالتو
              </Link>
              <Link
                href="/products?sale=1&sort=discount"
                className="ds-nav-tab ds-nav-tab-sale"
                onMouseEnter={() => setActiveMenuId(null)}
                onClick={closeAll}
              >
                حراج استایل
              </Link>
            </nav>
          )}
        </div>

        <div className="ds-header-end">
          <button
            className="ds-search-box"
            type="button"
            aria-label="جستجو در دیجی‌استایل"
            onClick={() => setSearch(true)}
          >
            <Icon name="search" size={18} />
            <span>
              جستجو در <strong>دیجی‌استایل</strong>
            </span>
          </button>

          <div className="ds-header-actions">
            <Link
              className="ds-auth-btn"
              href="/profile"
              aria-label={customer ? "حساب کاربری" : "ورود یا ثبت نام"}
              onClick={closeAll}
            >
              <Icon name={isPdp && !customer ? "login" : "user"} size={20} />
              <span>{customer ? "حساب کاربری" : "ورود | ثبت نام"}</span>
            </Link>

            <Link
              className="ds-icon-btn"
              href={customer ? "/profile/favorites" : "/wishlist"}
              aria-label={`علاقه‌مندی‌ها، ${number(wishlist.length)} کالا`}
              onClick={closeAll}
            >
              <Icon name="heart" size={22} />
              {wishlist.length > 0 && (
                <span className="ds-cart-badge">{number(wishlist.length)}</span>
              )}
            </Link>

            <button
              className="ds-icon-btn"
              type="button"
              aria-label={`سبد خرید، ${number(count)} کالا`}
              onClick={() => {
                closeAll()
                openCart()
              }}
            >
              <Icon name={isPdp ? "cart" : "bag"} size={22} />
              {count > 0 && (
                <span className="ds-cart-badge">{number(count)}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {isPdp && (
        <nav
          className="ds-nav-tabs ds-pdp-categories"
          aria-label="دسته‌بندی‌های دیجی‌استایل"
        >
          {categoryButtons}
        </nav>
      )}

      {activeMenu && (
        <div className="ds-mega">
          <div className="ds-mega-inner">
            <div className="ds-mega-top">
              <Link
                className="ds-mega-all"
                href={activeMenu.href}
                onClick={closeAll}
              >
                همه محصولات {activeMenu.title}
                <Icon name="left" size={14} />
              </Link>
              <Link
                className="ds-mega-all"
                href="/landings/jackets"
                onClick={closeAll}
              >
                لندینگ کاپشن و پالتو
                <Icon name="left" size={14} />
              </Link>
            </div>
            <div className="ds-mega-cols">
              {activeMenu.children.map((sub) => (
                <div className="ds-mega-col" key={sub.id}>
                  <h3>
                    <Link href={sub.href} onClick={closeAll}>
                      {sub.title}
                    </Link>
                  </h3>
                  <ul>
                    {sub.items.map((leaf) => (
                      <li key={leaf.id}>
                        <Link href={leaf.href} onClick={closeAll}>
                          {leaf.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mobileNav && (
        <div className="ds-mobile-drawer">
          <div className="ds-mobile-drawer-links">
            {STATIC_MEGA_MENU.map((item) => (
              <Link key={item.id} href={item.href} onClick={closeAll}>
                {item.title}
              </Link>
            ))}
            <Link href="/landings/jackets" onClick={closeAll}>
              کاپشن و پالتو
            </Link>
            <Link
              href="/products?sale=1&sort=discount"
              className="ds-nav-tab-sale"
              onClick={closeAll}
            >
              حراج استایل
            </Link>
            <Link href="/products" onClick={closeAll}>
              همه محصولات
            </Link>
          </div>
        </div>
      )}

      {search && (
        <Modal label="جستجو در دیجی‌استایل" onClose={() => setSearch(false)}>
          <form
            className="store-search-form"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              if (query.trim()) {
                closeAll()
                router.push(
                  `/products?${new URLSearchParams({ q: query.trim() })}`
                )
              }
            }}
          >
            <input
              autoFocus
              name="q"
              type="search"
              value={query}
              maxLength={150}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در محصولات، برندها و دسته‌بندی‌ها..."
              aria-label="عبارت جستجو"
            />
            <button
              type="submit"
              className="store-button"
              disabled={!query.trim()}
            >
              جستجو
            </button>
          </form>
          {query.trim() ? (
            <div className="store-search-results">
              {suggestions.length > 0 && (
                <section>
                  <h3>محصولات</h3>
                  {suggestions.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${encodeURIComponent(product.handle)}`}
                      onClick={closeAll}
                    >
                      <Media src={product.images[0]} alt="" />
                      {product.title}
                    </Link>
                  ))}
                </section>
              )}
              {matchingCategories.length > 0 && (
                <section>
                  <h3>دسته‌بندی‌ها</h3>
                  {matchingCategories.map((category) => (
                    <Link
                      key={category.handle}
                      href={`/categories/${encodeURIComponent(category.handle)}`}
                      onClick={closeAll}
                    >
                      {category.name}
                      <Icon name="left" size={13} />
                    </Link>
                  ))}
                </section>
              )}
              {matchingBrands.length > 0 && (
                <section>
                  <h3>برندها</h3>
                  {matchingBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brands/${encodeURIComponent(brand.handle)}`}
                      onClick={closeAll}
                    >
                      {brand.name}
                      <Icon name="left" size={13} />
                    </Link>
                  ))}
                </section>
              )}
              {!suggestions.length &&
                !matchingCategories.length &&
                !matchingBrands.length && (
                  <p role="status">پیشنهادی برای این عبارت پیدا نشد.</p>
                )}
            </div>
          ) : (
            <div className="store-search-results">
              <section>
                <h3>جستجوهای محبوب</h3>
                <Link href="/landings/jackets" onClick={closeAll}>
                  کاپشن زنانه و مردانه
                  <Icon name="left" size={13} />
                </Link>
                <Link
                  href="/product/22797531-%DA%A9%D8%A7%D9%BE%D8%B4%D9%86-%D8%B2%D9%86%D8%A7%D9%86%D9%87-%D8%B4%D9%85%D8%B9%DB%8C-%D8%A7%D9%85-%DA%A9%DB%8C-%D9%85%D8%AF%D9%84-l2005"
                  onClick={closeAll}
                >
                  کاپشن زنانه شمعی ام کی مدل L2005
                  <Icon name="left" size={13} />
                </Link>
                <Link href="/products?sale=1&sort=discount" onClick={closeAll}>
                  خوش‌قیمت‌های امروز
                  <Icon name="left" size={13} />
                </Link>
              </section>
            </div>
          )}
        </Modal>
      )}
    </header>
  )
}
