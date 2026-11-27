"use client"

import type { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { OtpLogin } from "@/app/account/otp-login"
import { WishlistLine } from "@/components/commerce/wishlist-line"
import { Breadcrumbs, Icon } from "@/components/layout/ui"
import { useCommerce } from "@/lib/commerce"
import { toPersian } from "@/lib/format"
import {
  customerDisplayName,
  formatPersianPhone,
  PROFILE_NAV_ITEMS,
  type ProfileSection,
} from "@/lib/profile"
import { ProfileGiftCard, ProfileWallet } from "./profile-credit"
import { ProfileOrders } from "./profile-orders"
import { ProfileReviews } from "./profile-reviews"
import { ProfileAddresses, ProfileSettings } from "./profile-settings"
import {
  ProfileEmpty,
  ProfileLink,
  ProfilePanel,
  type ProfileIcon,
} from "./profile-ui"
import styles from "./profile.module.css"

const NAV_ICONS: Record<ProfileSection, ProfileIcon> = {
  overview: "grid",
  orders: "box",
  favorites: "heart",
  comments: "message",
  addresses: "pin",
  wallet: "wallet",
  "gift-card": "gift",
  "personal-info": "user",
}

const NAV_ITEMS = [
  { id: "overview", label: "نمای کلی", href: "/profile" },
  ...PROFILE_NAV_ITEMS,
] as const

export function ProfilePage({ section }: { section: ProfileSection }) {
  const { accountReady, customer } = useCommerce()
  if (!accountReady) {
    return (
      <main className={`store-wrap store-page ${styles.page}`}>
        <p className={styles.message} role="status">
          در حال بارگذاری حساب کاربری…
        </p>
      </main>
    )
  }
  if (!customer) return <OtpLogin />

  return (
    <ProfileDashboard key={customer.id} section={section} customer={customer} />
  )
}

function ProfileDashboard({
  section,
  customer,
}: {
  section: ProfileSection
  customer: HttpTypes.StoreCustomer
}) {
  const { busy, logout } = useCommerce()
  const item = NAV_ITEMS.find(({ id }) => id === section)!
  const overview = section === "overview"
  const displayName = customerDisplayName(customer)
  const phone = formatPersianPhone(customer.phone)

  return (
    <main className={`store-wrap store-page ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: "حساب کاربری", href: overview ? undefined : "/profile" },
          ...(overview ? [] : [{ label: item.label }]),
        ]}
      />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Link className={styles.identity} href="/profile/personal-info">
            <span className={styles.avatar}>
              <Icon name="user" size={24} />
            </span>
            <span>
              <strong>
                <bdi>{displayName}</bdi>
              </strong>
              {phone && phone !== displayName && (
                <small>
                  <bdi>{phone}</bdi>
                </small>
              )}
            </span>
            <Icon name="left" size={16} />
          </Link>
          <nav className={styles.nav} aria-label="بخش‌های حساب کاربری">
            {NAV_ITEMS.map(({ id, href, label }) => (
              <Link
                key={id}
                href={href}
                aria-current={section === id ? "page" : undefined}
              >
                <Icon name={NAV_ICONS[id]} size={19} />
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className={styles.signOut}
            disabled={busy}
            onClick={() => void logout().catch(() => {})}
          >
            <Icon name="login" size={18} />
            خروج از حساب
          </button>
        </aside>

        <div className={styles.content}>
          <header className={styles.pageHeading}>
            <h1>{overview ? "حساب کاربری من" : item.label}</h1>
            {overview && customer.first_name?.trim() && (
              <p>{customer.first_name.trim()}، خوش آمدید.</p>
            )}
          </header>
          {overview && (
            <>
              <ProfileOrders overview />
              <AccountShortcuts
                addressCount={customer.addresses?.length ?? 0}
              />
            </>
          )}
          {section === "orders" && <ProfileOrders />}
          {section === "favorites" && <ProfileFavorites />}
          {section === "comments" && <ProfileReviews />}
          {section === "addresses" && <ProfileAddresses customer={customer} />}
          {section === "wallet" && <ProfileWallet />}
          {section === "gift-card" && <ProfileGiftCard />}
          {section === "personal-info" && (
            <ProfileSettings customer={customer} />
          )}
        </div>
      </div>
    </main>
  )
}

function AccountShortcuts({ addressCount }: { addressCount: number }) {
  const { wishlist } = useCommerce()

  return (
    <div className={styles.shortcuts}>
      <Link href="/profile/favorites">
        <span className={styles.shortcutIcon}>
          <Icon name="heart" size={22} />
        </span>
        <span>
          <strong>علاقه‌مندی‌ها</strong>
          <small>{toPersian(wishlist.length)} کالای ذخیره‌شده</small>
        </span>
        <Icon name="left" size={16} />
      </Link>
      <Link href="/profile/addresses">
        <span className={styles.shortcutIcon}>
          <Icon name="pin" size={22} />
        </span>
        <span>
          <strong>نشانی‌های تحویل</strong>
          <small>{toPersian(addressCount)} نشانی ذخیره‌شده</small>
        </span>
        <Icon name="left" size={16} />
      </Link>
    </div>
  )
}

function ProfileFavorites() {
  const { wishlist } = useCommerce()

  return (
    <ProfilePanel title="محصولات ذخیره‌شده">
      {wishlist.length ? (
        <div className={`${styles.entries} ${styles.favorites}`}>
          {wishlist.map((product) => (
            <WishlistLine product={product} key={product.id} />
          ))}
        </div>
      ) : (
        <ProfileEmpty
          icon="heart"
          title="هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید."
        >
          <ProfileLink href="/products">مرور محصولات</ProfileLink>
        </ProfileEmpty>
      )}
    </ProfilePanel>
  )
}
