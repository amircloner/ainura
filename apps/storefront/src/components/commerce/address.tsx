import type { HttpTypes } from "@medusajs/types"
import { latinDigits } from "@/lib/format"

export function AddressFields({
  address,
}: {
  address?: Partial<HttpTypes.StoreCreateCustomerAddress>
}) {
  return (
    <div className="commerce-fields">
      <label>
        نام گیرنده
        <input
          name="first_name"
          autoComplete="given-name"
          defaultValue={address?.first_name ?? ""}
          required
        />
      </label>
      <label>
        نام خانوادگی
        <input
          name="last_name"
          autoComplete="family-name"
          defaultValue={address?.last_name ?? ""}
          required
        />
      </label>
      <label>
        استان
        <input
          name="province"
          autoComplete="address-level1"
          defaultValue={address?.province ?? ""}
          required
        />
      </label>
      <label>
        شهر
        <input
          name="city"
          autoComplete="address-level2"
          defaultValue={address?.city ?? ""}
          required
        />
      </label>
      <label className="commerce-wide">
        آدرس کامل
        <input
          name="address_1"
          autoComplete="street-address"
          defaultValue={address?.address_1 ?? ""}
          required
        />
      </label>
      <label>
        کد پستی
        <input
          name="postal_code"
          autoComplete="postal-code"
          inputMode="numeric"
          pattern="[0-9۰-۹٠-٩]{10}"
          dir="ltr"
          defaultValue={address?.postal_code ?? ""}
          required
        />
      </label>
      <label>
        موبایل
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          pattern="[0٠۰][9۹٩][0-9۰-۹٠-٩]{9}"
          dir="ltr"
          defaultValue={address?.phone ?? ""}
          required
        />
      </label>
    </div>
  )
}

export function readAddress(
  data: FormData
): HttpTypes.StoreCreateCustomerAddress {
  const field = (name: string) => String(data.get(name) ?? "").trim()
  const postal_code = latinDigits(field("postal_code"))
  const phone = latinDigits(field("phone"))
  if (!/^\d{10}$/.test(postal_code))
    throw new Error("کد پستی باید ۱۰ رقم باشد.")
  if (!/^09\d{9}$/.test(phone)) throw new Error("شماره موبایل معتبر وارد کنید.")
  const address = {
    country_code: "ir",
    first_name: field("first_name"),
    last_name: field("last_name"),
    address_1: field("address_1"),
    city: field("city"),
    province: field("province"),
    postal_code,
    phone,
  }
  if (Object.values(address).some((field) => !field))
    throw new Error("همه فیلدهای نشانی الزامی هستند.")
  return address
}
