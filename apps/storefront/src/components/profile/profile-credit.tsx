"use client"

import { useState, type FormEvent } from "react"
import { Icon } from "@/components/layout/ui"
import { formatPrice, latinDigits } from "@/lib/format"
import { sdk } from "@/lib/medusa"
import { formatPersianDate } from "@/lib/profile"
import {
  ProfileEmpty,
  ProfileLink,
  ProfileLoad,
  ProfilePanel,
} from "./profile-ui"
import { useProfileResource } from "./resource"
import styles from "./profile.module.css"

type Credit = {
  id: string
  currency_code: string
  balance: number
}

type GiftCard = {
  value: number
  currency_code: string
  expires_at?: string | null
  status: "pending" | "redeemed"
}

function isMissing(error: unknown) {
  return (error as { status?: number } | null)?.status === 404
}

async function loadCredit() {
  try {
    const accounts: Credit[] = []
    for (let offset = 0; ;) {
      const { store_credit_accounts, count } = await sdk.client.fetch<{
        store_credit_accounts: Credit[]
        count: number
      }>("/store/store-credit-accounts", {
        query: { limit: 20, offset, fields: "id,currency_code" },
      })
      accounts.push(...store_credit_accounts)
      offset += store_credit_accounts.length
      if (!store_credit_accounts.length || offset >= count) return accounts
    }
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

export function ProfileWallet() {
  const credit = useProfileResource(loadCredit)
  return (
    <ProfilePanel title="موجودی حساب">
      {credit.status !== "ready" ? (
        <ProfileLoad status={credit.status} retry={credit.retry} />
      ) : !credit.data ? (
        <ProfileEmpty icon="wallet" title="اعتبار فروشگاه در دسترس نیست." />
      ) : !credit.data.length ? (
        <ProfileEmpty
          icon="wallet"
          title="هنوز اعتباری در حساب شما ثبت نشده است."
        />
      ) : (
        <div className={styles.entries}>
          {credit.data.map((account) => (
            <div key={account.id} className={styles.balance}>
              <div>
                <Icon name="wallet" size={23} />
                <span>اعتبار قابل استفاده</span>
              </div>
              <strong>
                {formatPrice(account.balance, account.currency_code)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </ProfilePanel>
  )
}

export function ProfileGiftCard() {
  const credit = useProfileResource(loadCredit)
  const [card, setCard] = useState<GiftCard>()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function checkCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCard(undefined)
    setError("")
    const code = latinDigits(
      String(new FormData(event.currentTarget).get("code") ?? "")
    ).trim()
    if (!code) {
      setError("کد کارت هدیه را وارد کنید.")
      return
    }
    setPending(true)
    try {
      const { gift_card } = await sdk.client.fetch<{ gift_card: GiftCard }>(
        `/store/gift-cards/${encodeURIComponent(code)}`,
        { query: { fields: "value,currency_code,status,expires_at" } }
      )
      setCard(gift_card)
    } catch (error) {
      setError(
        isMissing(error)
          ? "کارت هدیه با این کد پیدا نشد."
          : "استعلام کارت هدیه ممکن نشد."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <ProfilePanel title="استعلام کارت هدیه">
      {credit.status !== "ready" ? (
        <ProfileLoad status={credit.status} retry={credit.retry} />
      ) : credit.data === null ? (
        <ProfileEmpty icon="gift" title="سرویس کارت هدیه در دسترس نیست." />
      ) : (
        <div className={styles.entries}>
          <form className={styles.form} onSubmit={checkCard}>
            <label>
              کد کارت هدیه
              <input
                name="code"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                maxLength={100}
                disabled={pending}
                required
              />
            </label>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <button
                className={styles.primary}
                type="submit"
                disabled={pending}
              >
                {pending ? "در حال بررسی…" : "بررسی کارت"}
              </button>
            </div>
          </form>
          {card && (
            <dl className={styles.detailsGrid} aria-live="polite">
              <div>
                <dt>ارزش کارت</dt>
                <dd>{formatPrice(card.value, card.currency_code)}</dd>
              </div>
              <div>
                <dt>وضعیت</dt>
                <dd>{giftStatus(card)}</dd>
              </div>
              {card.expires_at && (
                <div>
                  <dt>تاریخ انقضا</dt>
                  <dd>{formatPersianDate(card.expires_at)}</dd>
                </div>
              )}
            </dl>
          )}
          <ProfileLink href="/profile/wallet">
            مشاهده اعتبار فروشگاه
          </ProfileLink>
        </div>
      )}
    </ProfilePanel>
  )
}

function giftStatus(card: GiftCard) {
  if (card.expires_at && Date.parse(card.expires_at) < Date.now())
    return "منقضی شده"
  if (card.status === "pending") return "در انتظار فعال‌سازی"
  return "صادر شده"
}
