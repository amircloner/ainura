"use client"

import type { HttpTypes } from "@medusajs/types"
import { useState, type FormEvent } from "react"
import { AddressFields, readAddress } from "@/components/commerce/address"
import { Icon, Modal } from "@/components/layout/ui"
import {
  commerceError,
  customerContactEmail,
  useCommerce,
} from "@/lib/commerce"
import { toPersian } from "@/lib/format"
import { formatPersianPhone, isValidEmail } from "@/lib/profile"
import { ProfileEmpty, ProfilePanel } from "./profile-ui"
import styles from "./profile.module.css"

type Customer = HttpTypes.StoreCustomer
type Address = NonNullable<Customer["addresses"]>[number]
type AddressDialog =
  { type: "add" } | { type: "edit" | "delete"; address: Address }

export function ProfileAddresses({ customer }: { customer: Customer }) {
  const { busy, setDefaultAddress } = useCommerce()
  const [dialog, setDialog] = useState<AddressDialog>()
  const addresses = customer.addresses ?? []
  const addAddress = (
    <button
      type="button"
      className={styles.primary}
      onClick={() => setDialog({ type: "add" })}
    >
      <Icon name="plus" size={18} /> افزودن نشانی
    </button>
  )

  return (
    <ProfilePanel
      title="نشانی‌های ذخیره‌شده"
      action={addresses.length ? addAddress : undefined}
    >
      {addresses.length ? (
        <div className={styles.entries}>
          {addresses.map((address) => {
            const recipient = [address.first_name, address.last_name]
              .filter(Boolean)
              .join(" ")
            return (
              <article key={address.id} className={styles.entry}>
                <div className={styles.entryTop}>
                  <h3>
                    {address.address_name || address.city || "نشانی تحویل"}
                  </h3>
                  {address.is_default_shipping && (
                    <span className={styles.badge}>پیش‌فرض ارسال</span>
                  )}
                </div>
                <p>
                  {[
                    address.province,
                    address.city,
                    address.address_1,
                    address.address_2,
                  ]
                    .filter(Boolean)
                    .join("، ")}
                </p>
                <dl className={styles.detailsGrid}>
                  {recipient && (
                    <div>
                      <dt>گیرنده</dt>
                      <dd>{recipient}</dd>
                    </div>
                  )}
                  {address.phone && (
                    <div>
                      <dt>شماره تماس</dt>
                      <dd>
                        <bdi>{formatPersianPhone(address.phone)}</bdi>
                      </dd>
                    </div>
                  )}
                  {address.postal_code && (
                    <div>
                      <dt>کد پستی</dt>
                      <dd>
                        <bdi>{toPersian(address.postal_code)}</bdi>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => setDialog({ type: "edit", address })}
                  >
                    ویرایش
                  </button>
                  {!address.is_default_shipping && (
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={busy}
                      onClick={() =>
                        void setDefaultAddress(address.id).catch(() => {})
                      }
                    >
                      انتخاب برای ارسال پیش‌فرض
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => setDialog({ type: "delete", address })}
                  >
                    حذف
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <ProfileEmpty icon="pin" title="هنوز نشانی تحویل ثبت نکرده‌اید.">
          {addAddress}
        </ProfileEmpty>
      )}
      {dialog && (
        <AddressEditor
          dialog={dialog}
          customer={customer}
          onClose={() => setDialog(undefined)}
        />
      )}
    </ProfilePanel>
  )
}

function AddressEditor({
  dialog,
  customer,
  onClose,
}: {
  dialog: AddressDialog
  customer: Customer
  onClose: () => void
}) {
  const { busy, changeAddress, editAddress } = useCommerce()
  const [error, setError] = useState("")
  const address = dialog.type === "add" ? undefined : dialog.address
  const initial = address ?? customer
  const title =
    dialog.type === "delete"
      ? "حذف نشانی"
      : address
        ? "ویرایش نشانی"
        : "نشانی جدید"

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    try {
      if (dialog.type === "delete") {
        await changeAddress(dialog.address.id)
      } else {
        const data = new FormData(event.currentTarget)
        const fields = readAddress(data)
        const input = {
          ...fields,
          country_code: address?.country_code ?? fields.country_code,
          address_name: String(data.get("address_name") ?? "").trim() || null,
        }
        if (address) await editAddress(address.id, input)
        else
          await changeAddress({
            ...input,
            is_default_shipping: !customer.addresses?.length,
          })
      }
      onClose()
    } catch (error) {
      setError(commerceError(error))
    }
  }

  return (
    <Modal
      label={title}
      className={styles.dialog}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form className={styles.form} onSubmit={save}>
        {dialog.type === "delete" ? (
          <p>این نشانی از فهرست نشانی‌های ذخیره‌شده حذف شود؟</p>
        ) : (
          <>
            <label>
              عنوان نشانی
              <input
                name="address_name"
                maxLength={80}
                defaultValue={address?.address_name ?? ""}
                placeholder="خانه، محل کار و…"
              />
            </label>
            <AddressFields address={initial} />
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="submit"
            className={
              dialog.type === "delete" ? styles.danger : styles.primary
            }
            disabled={busy}
          >
            {dialog.type === "delete" ? "حذف نشانی" : "ذخیره نشانی"}
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClose}
            disabled={busy}
          >
            انصراف
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ProfileSettings({ customer }: { customer: Customer }) {
  const { busy, updateCustomer } = useCommerce()
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const email = customerContactEmail(customer)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSaved(false)
    const data = new FormData(event.currentTarget)
    const first_name = String(data.get("first_name") ?? "").trim()
    const last_name = String(data.get("last_name") ?? "").trim()
    const contact_email = String(data.get("contact_email") ?? "").trim()
    if (!first_name || !last_name) {
      setError("نام و نام خانوادگی را وارد کنید.")
      return
    }
    if (contact_email && !isValidEmail(contact_email)) {
      setError("ایمیل معتبر وارد کنید.")
      return
    }
    try {
      await updateCustomer({
        first_name,
        last_name,
        metadata: { contact_email: contact_email || null },
      })
      setSaved(true)
      setEditing(false)
    } catch (error) {
      setError(commerceError(error))
    }
  }

  return (
    <ProfilePanel
      title="مشخصات و اطلاعات تماس"
      action={
        !editing && (
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setSaved(false)
              setEditing(true)
            }}
          >
            ویرایش مشخصات
          </button>
        )
      }
    >
      {editing ? (
        <form className={styles.form} onSubmit={save}>
          <div className={styles.formGrid}>
            <label>
              نام
              <input
                name="first_name"
                autoComplete="given-name"
                maxLength={80}
                defaultValue={customer.first_name ?? ""}
                required
              />
            </label>
            <label>
              نام خانوادگی
              <input
                name="last_name"
                autoComplete="family-name"
                maxLength={80}
                defaultValue={customer.last_name ?? ""}
                required
              />
            </label>
          </div>
          <label>
            ایمیل تماس
            <input
              name="contact_email"
              type="email"
              autoComplete="email"
              dir="ltr"
              maxLength={254}
              defaultValue={email ?? ""}
            />
          </label>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={busy}>
              ذخیره تغییرات
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => {
                setEditing(false)
                setError("")
              }}
            >
              انصراف
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className={styles.detailsGrid}>
            <div>
              <dt>نام</dt>
              <dd>{customer.first_name || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>نام خانوادگی</dt>
              <dd>{customer.last_name || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>شماره ورود</dt>
              <dd>
                {customer.phone ? (
                  <bdi>{formatPersianPhone(customer.phone)}</bdi>
                ) : (
                  "ثبت نشده"
                )}
              </dd>
            </div>
            <div>
              <dt>ایمیل تماس</dt>
              <dd>{email ? <bdi>{email}</bdi> : "ثبت نشده"}</dd>
            </div>
          </dl>
          {saved && (
            <p role="status" className={styles.success}>
              تغییرات ذخیره شد.
            </p>
          )}
        </>
      )}
    </ProfilePanel>
  )
}
