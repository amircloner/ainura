"use client"

import type { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  connected,
  getRegion,
  sdk,
  tokenKey,
  type CatalogProduct,
  type CatalogVariant,
} from "./medusa"

type CartLine = {
  id: string
  product: CatalogProduct
  variant: CatalogVariant
  quantity: number
}
type Address = HttpTypes.StoreCreateCustomerAddress
type RemoteWishlist = Record<string, string>
const cartKey = "ainura-cart"
const demoCartKey = "ainura-demo-cart"
const wishlistKey = "ainura-wishlist"

function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback
  } catch {
    return fallback
  }
}

export const commerceError = (error: unknown) =>
  error instanceof Error ? error.message : "عملیات انجام نشد. دوباره تلاش کنید."

// Phone-only accounts have a Medusa identity address, not a delivery address.
export const contactEmail = (email?: string | null) =>
  email?.endsWith("@phone.invalid") ? undefined : email || undefined

function useCommerceState(
  catalog: CatalogProduct[],
  colorMap: Record<string, string> = {}
) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const [isCartOpen, setCartOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [localCart, setLocalCart] = useState<CartLine[]>([])
  const [liveCart, setLiveCart] = useState<HttpTypes.StoreCart | null>(null)
  const [localWishlist, setLocalWishlist] = useState<string[]>([])
  const [remoteWishlist, setRemoteWishlist] = useState<RemoteWishlist>({})
  const [demoPromo, setDemoPromo] = useState(false)

  async function refreshWishlist() {
    const items: RemoteWishlist = {}
    for (let offset = 0; ; offset += 50) {
      const page = await sdk.store.wishlist.list({ limit: 50, offset })
      for (const item of page.wishlist_items) items[item.product_id] = item.id
      if (
        !page.wishlist_items.length ||
        Object.keys(items).length >= page.count
      )
        break
    }
    setRemoteWishlist(items)
  }

  useEffect(() => {
    let active = true
    setLocalCart(readLocal(demoCartKey, []))
    setLocalWishlist(readLocal(wishlistKey, []))
    setReady(true)
    if (!connected) return
    const saved = readLocal<string | null>(cartKey, null)
    if (saved) {
      sdk.store.cart
        .retrieve(saved)
        .then(({ cart }) => {
          if (!active || readLocal(cartKey, null) !== saved) return
          if (!cart.completed_at && cart.items?.length)
            setLiveCart((current) => current ?? cart)
          else localStorage.removeItem(cartKey)
        })
        .catch((error: unknown) => {
          if (
            active &&
            (error as { status?: number }).status === 404 &&
            readLocal(cartKey, null) === saved
          )
            localStorage.removeItem(cartKey)
        })
    }
    if (localStorage.getItem(tokenKey)) {
      sdk.store.customer
        .retrieve({ fields: "+addresses" })
        .then(({ customer }) => {
          if (!active) return
          setCustomer(customer)
          return refreshWishlist()
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(demoCartKey, JSON.stringify(localCart))
    localStorage.setItem(wishlistKey, JSON.stringify(localWishlist))
  }, [ready, localCart, localWishlist])

  async function run<T>(action: () => Promise<T>) {
    if (locked.current) throw new Error("لطفاً تا پایان عملیات صبر کنید.")
    locked.current = true
    setBusy(true)
    setNotice("")
    try {
      return await action()
    } catch (error) {
      setNotice(commerceError(error))
      throw error
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  function rememberCart(cart: HttpTypes.StoreCart | null) {
    setLiveCart(cart)
    if (cart) localStorage.setItem(cartKey, JSON.stringify(cart.id))
    else localStorage.removeItem(cartKey)
  }

  async function ensureCart() {
    if (liveCart) return liveCart
    const saved = readLocal<string | null>(cartKey, null)
    if (saved) {
      const existing = await sdk.store.cart
        .retrieve(saved)
        .catch((error: unknown) => {
          if ((error as { status?: number }).status !== 404) throw error
        })
      if (existing && !existing.cart.completed_at) return existing.cart
    }
    const region = await getRegion()
    const { cart } = await sdk.store.cart.create({
      region_id: region.id,
      email: contactEmail(customer?.email),
    })
    rememberCart(cart)
    return cart
  }

  const cart: CartLine[] = liveCart?.items?.length
    ? liveCart.items.map((line) => {
        const product = catalog.find(({ id }) => id === line.product_id)
        const known = product?.variants.find(({ id }) => id === line.variant_id)
        const variant = {
          id: line.variant_id ?? "",
          color: known?.color ?? "",
          size: known?.size ?? line.variant_title ?? "",
          price: line.unit_price,
          originalPrice: line.compare_at_unit_price ?? line.unit_price,
          available: known?.available ?? true,
        }
        return {
          id: line.id,
          quantity: line.quantity,
          variant,
          product: product ?? {
            id: line.product_id ?? "",
            title: line.product_title ?? line.title,
            handle: line.product_handle ?? "",
            description: "",
            category: { handle: "all", name: "همه محصولات" },
            brand: null,
            images: line.thumbnail ? [line.thumbnail] : [],
            variants: [variant],
            metadata: {},
            created_at: "",
            currency: liveCart.currency_code,
          },
        }
      })
    : localCart
  const isDemoCart = !liveCart?.items?.length
  const guestIds = new Set(localWishlist)
  const wishlist = catalog.filter((product) =>
    customer && !product.demo
      ? Boolean(remoteWishlist[product.id])
      : guestIds.has(product.id)
  )
  const subtotal = !isDemoCart
    ? (liveCart?.item_subtotal ?? 0)
    : localCart.reduce(
        (total, line) => total + line.quantity * line.variant.price,
        0
      )
  const discount = !isDemoCart
    ? (liveCart?.discount_total ?? 0)
    : demoPromo
      ? Math.floor(subtotal * 0.1)
      : 0
  const shipping = !isDemoCart ? (liveCart?.shipping_total ?? 0) : 0
  const total = !isDemoCart
    ? (liveCart?.total ?? subtotal)
    : subtotal - discount
  const currency = !isDemoCart ? liveCart?.currency_code : "irt"

  async function addToCart(
    product: CatalogProduct,
    variantId: string,
    quantity = 1
  ) {
    await run(async () => {
      const variant = product.variants.find(({ id }) => id === variantId)
      if (
        !variant?.available ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      )
        throw new Error("این گزینه موجود نیست.")
      if (product.demo) {
        if (liveCart?.items?.length)
          throw new Error("ابتدا سبد خرید اصلی را خالی کنید.")
        setLocalCart((lines) =>
          lines.some(({ id }) => id === variantId)
            ? lines.map((line) =>
                line.id === variantId
                  ? { ...line, quantity: line.quantity + quantity }
                  : line
              )
            : [...lines, { id: variantId, product, variant, quantity }]
        )
      } else {
        if (localCart.length)
          throw new Error("ابتدا سبد خرید آزمایشی را خالی کنید.")
        const activeCart = await ensureCart()
        const { cart: updated } = await sdk.store.cart.createLineItem(
          activeCart.id,
          { variant_id: variantId, quantity }
        )
        rememberCart(updated)
      }
      setCartOpen(true)
    })
  }

  async function updateQuantity(id: string, quantity: number) {
    await run(async () => {
      if (!Number.isSafeInteger(quantity) || quantity < 0) return
      if (isDemoCart) {
        setLocalCart((lines) =>
          quantity
            ? lines.map((line) =>
                line.id === id ? { ...line, quantity } : line
              )
            : lines.filter((line) => line.id !== id)
        )
      } else if (liveCart) {
        const updated = quantity
          ? (await sdk.store.cart.updateLineItem(liveCart.id, id, { quantity }))
              .cart
          : (await sdk.store.cart.deleteLineItem(liveCart.id, id)).parent
        rememberCart(updated?.items?.length ? updated : null)
      }
    })
  }

  async function applyCoupon(code: string) {
    await run(async () => {
      const trimmed = code.trim()
      if (!trimmed) return
      if (isDemoCart) {
        if (trimmed.toUpperCase() !== "AINURA10")
          throw new Error("کد تخفیف معتبر نیست.")
        setDemoPromo(true)
      } else if (liveCart) {
        const { cart: updated } = await sdk.store.cart.update(liveCart.id, {
          promo_codes: [
            ...new Set([
              ...liveCart.promotions
                .filter(
                  (promotion) => !promotion.is_automatic && promotion.code
                )
                .map((promotion) => promotion.code!),
              trimmed,
            ]),
          ],
        })
        rememberCart(updated)
        if (
          !updated.promotions.some(
            (promotion) =>
              promotion.code?.toLowerCase() === trimmed.toLowerCase()
          )
        )
          throw new Error("کد تخفیف روی سبد اعمال نشد.")
      }
      setNotice("کد تخفیف اعمال شد.")
    })
  }

  async function toggleWishlist(product: CatalogProduct) {
    try {
      await run(async () => {
        if (!customer || product.demo) {
          setLocalWishlist((ids) =>
            ids.includes(product.id)
              ? ids.filter((id) => id !== product.id)
              : [...ids, product.id]
          )
          return
        }
        const id = remoteWishlist[product.id]
        if (id) {
          await sdk.store.wishlist.delete(id)
          setRemoteWishlist(
            ({ [product.id]: _removed, ...remaining }) => remaining
          )
        } else {
          const { wishlist_item } = await sdk.store.wishlist.create({
            product_id: product.id,
          })
          setRemoteWishlist((items) => ({
            ...items,
            [product.id]: wishlist_item.id,
          }))
        }
      })
    } catch {
      /* notice is rendered by the provider */
    }
  }

  async function completeOtpLogin(token: string) {
    await run(async () => {
      if (!connected)
        throw new Error("ورود و ثبت‌نام در حالت آزمایشی فعال نیست.")
      await sdk.client.setToken(token)
      const { customer } = await sdk.store.customer
        .retrieve({ fields: "+addresses" })
        .catch(async () => {
          await sdk.client.clearToken()
          throw new Error("ورود تکمیل نشد. دوباره کد دریافت کنید.")
        })
      setCustomer(customer)
      if (liveCart?.items?.length)
        rememberCart((await sdk.store.cart.transferCart(liveCart.id)).cart)
      await refreshWishlist()
      const guestProducts = catalog.filter(
        (product) => !product.demo && localWishlist.includes(product.id)
      )
      if (guestProducts.length) {
        const migrated = await Promise.allSettled(
          guestProducts.map((product) =>
            sdk.store.wishlist.create({ product_id: product.id })
          )
        )
        const items = migrated.flatMap((result) =>
          result.status === "fulfilled" ? [result.value.wishlist_item] : []
        )
        setRemoteWishlist((current) => ({
          ...current,
          ...Object.fromEntries(
            items.map((item) => [item.product_id, item.id])
          ),
        }))
        setLocalWishlist((ids) =>
          ids.filter((id) => !items.some((item) => item.product_id === id))
        )
      }
    })
  }

  async function logout() {
    await run(async () => {
      await sdk.auth.logout()
      setCustomer(null)
      setRemoteWishlist({})
      rememberCart(null)
    })
  }

  async function changeAddress(address: Address | string) {
    await run(async () => {
      if (typeof address === "string")
        await sdk.store.customer.deleteAddress(address)
      else await sdk.store.customer.createAddress(address)
      setCustomer(
        (await sdk.store.customer.retrieve({ fields: "+addresses" })).customer
      )
    })
  }

  async function prepareCheckout(email: string, address: Address) {
    return run(async () => {
      if (isDemoCart)
        return [
          {
            id: "demo-standard",
            name: "ارسال عادی",
            amount: subtotal >= 2_500_000 ? 0 : 85000,
          },
          { id: "demo-express", name: "ارسال اکسپرس", amount: 145000 },
        ]
      if (!liveCart) throw new Error("سبد خرید خالی است.")
      const { cart: updated } = await sdk.store.cart.update(liveCart.id, {
        email,
        shipping_address: address,
        billing_address: address,
      })
      rememberCart(updated)
      const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
        cart_id: updated.id,
      })
      return shipping_options.map(({ id, name, amount }) => ({
        id,
        name,
        amount,
      }))
    })
  }

  async function chooseShipping(id: string) {
    return run(async () => {
      if (isDemoCart) return [{ id: "demo", name: "پرداخت آزمایشی" }]
      if (!liveCart) throw new Error("سبد خرید خالی است.")
      const { cart: updated } = await sdk.store.cart.addShippingMethod(
        liveCart.id,
        { option_id: id }
      )
      rememberCart(updated)
      const { payment_providers } =
        await sdk.store.payment.listPaymentProviders({
          region_id: updated.region_id!,
        })
      // ponytail: native system payments only; add provider-specific UI before exposing an online gateway.
      return payment_providers
        .filter(({ id }) => id === "pp_system_default")
        .map(({ id }) => ({ id, name: "پرداخت دستی / هنگام تحویل" }))
    })
  }

  async function completeCheckout(provider: string) {
    return run(async () => {
      if (!cart.length) throw new Error("سبد خرید خالی است.")
      if (isDemoCart) {
        setLocalCart([])
        setDemoPromo(false)
        return `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
      }
      if (!liveCart) throw new Error("سبد خرید خالی است.")
      if (provider !== "pp_system_default")
        throw new Error("روش پرداخت پشتیبانی نمی‌شود.")
      const current = (await sdk.store.cart.retrieve(liveCart.id)).cart
      await sdk.store.payment.initiatePaymentSession(current, {
        provider_id: provider,
      })
      const result = await sdk.store.cart.complete(current.id)
      if (result.type === "cart") throw new Error(result.error.message)
      rememberCart(null)
      return String(result.order.display_id ?? result.order.id)
    })
  }

  return {
    busy,
    ready,
    notice,
    cart,
    wishlist,
    customer,
    isCartOpen,
    isDemoCart,
    subtotal,
    discount,
    shipping,
    total,
    currency,
    colorMap,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    addToCart,
    updateQuantity,
    toggleWishlist,
    applyCoupon,
    completeOtpLogin,
    logout,
    changeAddress,
    prepareCheckout,
    chooseShipping,
    completeCheckout,
  }
}

const CommerceContext = createContext<ReturnType<
  typeof useCommerceState
> | null>(null)

export function CommerceProvider({
  catalog,
  colorMap = {},
  children,
}: {
  catalog: CatalogProduct[]
  colorMap?: Record<string, string>
  children: ReactNode
}) {
  const commerce = useCommerceState(catalog, colorMap)
  return (
    <CommerceContext.Provider value={commerce}>
      {children}
    </CommerceContext.Provider>
  )
}

export function useCommerce() {
  const value = useContext(CommerceContext)
  if (!value) throw new Error("Missing CommerceProvider")
  return value
}
