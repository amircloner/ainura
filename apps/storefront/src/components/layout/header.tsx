"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useCommerce } from "@/lib/commerce"
import type { CatalogBrand, CatalogProduct } from "@/lib/medusa"
import {
  categoriesFrom,
  categoryTrail,
  matchesProduct,
  matchesText,
} from "../catalog/catalog"
import { Icon, Media, Modal, number } from "./ui"

export function Header({
  products,
  brands,
}: {
  products: CatalogProduct[]
  brands: CatalogBrand[]
}) {
  const { cart, wishlist, openCart } = useCommerce()
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [menu, setMenu] = useState<string>()
  const [mobileNav, setMobileNav] = useState(false)
  const header = useRef<HTMLElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const categories = categoriesFrom(products)
  const roots = categories.filter((category) => !category.parent)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const suggestions = query.trim()
    ? products.filter((product) => matchesProduct(product, query)).slice(0, 5)
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
        setMenu(undefined)
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
        !header.current?.contains(event.target)
      ) {
        setMenu(undefined)
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

  function closeNavigation() {
    setMenu(undefined)
    setMobileNav(false)
    setSearch(false)
  }
  function toggleMenu(handle: string) {
    setMenu((current) => (current === handle ? undefined : handle))
  }

  return (
    <header className="store-header" ref={header}>
      <div className="store-announcement">
        <span>
          {products.length > 0 && products.every(({ demo }) => demo)
            ? "آینورا | کاتالوگ آزمایشی"
            : "آینورا، انتخابی برای هر روز"}
        </span>
        <Link href="/products?sale=1" onClick={closeNavigation}>
          فروش ویژه <Icon name="left" size={12} />
        </Link>
      </div>
      <div className="store-header-main store-wrap">
        <div className="store-header-find">
          <button
            className="store-icon store-mobile-menu"
            type="button"
            aria-label="دسته‌بندی‌ها"
            aria-expanded={mobileNav}
            aria-controls="store-main-nav"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Icon name="menu" />
          </button>
          <button
            className="store-search-trigger"
            type="button"
            aria-label="جستجو در آینورا"
            onClick={() => setSearch(true)}
          >
            <Icon name="search" />
            <span>جستجو در آینورا</span>
            <kbd dir="ltr">Ctrl K</kbd>
          </button>
        </div>
        <Link
          className="store-wordmark"
          href="/"
          onClick={closeNavigation}
          aria-label="آینورا، خانه"
        >
          <strong>آینورا</strong>
          <small lang="en" dir="ltr">
            AINURA
          </small>
        </Link>
        <div className="store-header-actions">
          <Link
            className="store-icon store-header-account"
            href="/account"
            aria-label="حساب کاربری"
            onClick={closeNavigation}
          >
            <Icon name="user" />
          </Link>
          <Link
            className="store-icon store-counter"
            href="/wishlist"
            aria-label={`علاقه‌مندی‌ها، ${number(wishlist.length)} کالا`}
            onClick={closeNavigation}
          >
            <Icon name="heart" />
            {wishlist.length > 0 && <span>{number(wishlist.length)}</span>}
          </Link>
          <button
            className="store-icon store-counter"
            type="button"
            aria-label={`سبد خرید، ${number(count)} کالا`}
            onClick={() => {
              closeNavigation()
              openCart()
            }}
          >
            <Icon name="bag" />
            {count > 0 && <span>{number(count)}</span>}
          </button>
        </div>
      </div>
      <nav
        id="store-main-nav"
        className={`store-main-nav${mobileNav ? " store-nav-open" : ""}`}
        aria-label="منوی اصلی"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setMenu(undefined)
        }}
      >
        <div className="store-nav-links store-wrap">
          {roots.map((category) => (
            <button
              key={category.handle}
              className="store-nav-trigger"
              type="button"
              aria-expanded={menu === category.handle}
              onClick={() => toggleMenu(category.handle)}
            >
              {category.name}
              <Icon name="down" size={12} />
            </button>
          ))}
          {brands.length > 0 && (
            <button
              className="store-nav-trigger"
              type="button"
              aria-expanded={menu === "brands"}
              onClick={() => toggleMenu("brands")}
            >
              برندها
              <Icon name="down" size={12} />
            </button>
          )}
          <Link
            href="/products?sale=1"
            className="store-nav-sale"
            onClick={closeNavigation}
          >
            فروش ویژه
          </Link>
          <Link
            href="/products"
            onClick={closeNavigation}
            aria-current={pathname === "/products" ? "page" : undefined}
          >
            همه محصولات
          </Link>
          <Link
            className="store-mobile-account"
            href="/account"
            onClick={closeNavigation}
          >
            حساب کاربری
          </Link>
        </div>
        {menu && (
          <div className="store-mega">
            <div className="store-wrap store-mega-links">
              {menu === "brands"
                ? brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brands/${encodeURIComponent(brand.handle)}`}
                      onClick={closeNavigation}
                    >
                      {brand.name}
                    </Link>
                  ))
                : roots
                    .filter((category) => category.handle === menu)
                    .map((root) => (
                      <div className="store-mega-categories" key={root.handle}>
                        <Link
                          className="store-strong"
                          href={`/categories/${encodeURIComponent(root.handle)}`}
                          onClick={closeNavigation}
                        >
                          همه محصولات {root.name}{" "}
                          <Icon name="arrow" size={15} />
                        </Link>
                        {categories
                          .filter(
                            (category) =>
                              category.handle !== root.handle &&
                              categoryTrail(category).some(
                                (item) => item.handle === root.handle
                              )
                          )
                          .map((category) => (
                            <Link
                              key={category.handle}
                              href={`/categories/${encodeURIComponent(category.handle)}`}
                              onClick={closeNavigation}
                            >
                              {category.name}
                            </Link>
                          ))}
                      </div>
                    ))}
            </div>
          </div>
        )}
      </nav>
      {search && (
        <Modal label="جستجو در آینورا" onClose={() => setSearch(false)}>
          <form
            className="store-search-form"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              if (query.trim()) {
                closeNavigation()
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
              placeholder="محصول، برند یا دسته‌بندی"
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
                      href={`/products/${encodeURIComponent(product.handle)}`}
                      onClick={closeNavigation}
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
                      onClick={closeNavigation}
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
                      onClick={closeNavigation}
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
            <p className="store-muted">
              نام محصول، کد، برند یا دسته‌بندی را وارد کنید.
            </p>
          )}
        </Modal>
      )}
    </header>
  )
}
