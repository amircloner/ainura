import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../helpers/create-admin-user"
import { createAuthenticatedCustomer } from "../../../../modules/helpers/create-authenticated-customer"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ api, dbConnection, dbUtils, getContainer }) => {
    let storeHeaders: ReturnType<typeof generateStoreHeaders>
    let customerHeaders: { headers: Record<string, string> }
    let otherCustomerHeaders: typeof customerHeaders
    let brandId: string
    let productId: string
    let variantId: string
    let draftId: string
    let hiddenId: string
    let otherVariantId: string

    beforeAll(async () => {
      const container = getContainer()
      await createAdminUser(dbConnection, adminHeaders, container)
      const key = await generatePublishableKey(container)
      storeHeaders = generateStoreHeaders({ publishableKey: key })
      const channels = await container
        .resolve(Modules.SALES_CHANNEL)
        .createSalesChannels([{ name: "Visible" }, { name: "Hidden" }])
      await api.post(
        `/admin/api-keys/${key.id}/sales-channels`,
        { add: [channels[0].id] },
        adminHeaders
      )
      const {
        data: { brand },
      } = await api.post(
        "/admin/brands",
        {
          name: "Fashion House",
          handle: "fashion-house",
          metadata: { internal: true },
        },
        adminHeaders
      )
      brandId = brand.id

      const profile = await container
        .resolve(Modules.FULFILLMENT)
        .createShippingProfiles({
          name: "Fashion",
          type: "default",
        })
      const createProduct = async (
        title: string,
        status: string,
        channel: string
      ) => {
        const { data } = await api.post(
          "/admin/products",
          {
            title,
            status,
            brand_id: brandId,
            shipping_profile_id: profile.id,
            sales_channels: [{ id: channel }],
            options: [{ title: "Size", values: ["M"] }],
            variants: [{ title: "Medium", options: { Size: "M" }, prices: [] }],
          },
          adminHeaders
        )
        return data.product
      }
      const product = await createProduct(
        "Visible product",
        "published",
        channels[0].id
      )
      productId = product.id
      variantId = product.variants[0].id
      draftId = (await createProduct("Draft product", "draft", channels[0].id))
        .id
      const hidden = await createProduct(
        "Other channel product",
        "published",
        channels[1].id
      )
      hiddenId = hidden.id
      otherVariantId = hidden.variants[0].id

      const customer = async (email: string) => {
        const { jwt } = await createAuthenticatedCustomer(api, storeHeaders, {
          email,
        })
        return {
          headers: { ...storeHeaders.headers, authorization: `Bearer ${jwt}` },
        }
      }
      customerHeaders = await customer("fashion@example.com")
      otherCustomerHeaders = await customer("other-fashion@example.com")
      await dbUtils.snapshot()
    })

    it("filters Store products by brand and limits brand expansions to public fields and visible products", async () => {
      const products = await api.get(
        `/store/products?brand_id[]=${brandId}&fields=id,brand_id,*brand,brand.metadata,reviews.id`,
        storeHeaders
      )
      expect(products.data.products).toEqual([
        expect.objectContaining({
          id: productId,
          brand_id: brandId,
          brand: expect.objectContaining({
            id: brandId,
            handle: "fashion-house",
          }),
        }),
      ])
      expect(products.data.products[0].brand).not.toHaveProperty("metadata")
      expect(products.data.products[0]).not.toHaveProperty("reviews")
      const unmatched = await api.get(
        "/store/products?brand_id=pbrand_missing",
        storeHeaders
      )
      expect(unmatched.data.count).toBe(0)
      const list = await api.get(
        "/store/brands?handle=fashion-house&fields=id,handle,products.title,metadata",
        storeHeaders
      )
      expect(list.data.count).toBe(1)
      expect(list.data.brands[0]).toEqual({
        id: brandId,
        handle: "fashion-house",
        products: [{ title: "Visible product" }],
      })
      const detail = await api.get(
        `/store/brands/${brandId}?fields=id,*products,products.reviews.id`,
        storeHeaders
      )
      expect(detail.data.brand.products).toEqual([
        expect.objectContaining({ id: productId }),
      ])
      expect(detail.data.brand.products[0]).not.toHaveProperty("reviews")
      await expect(
        api.get("/store/brands/missing", storeHeaders)
      ).rejects.toMatchObject({ response: { status: 404 } })
    })

    it("requires customer auth, validates and moderates submissions, aggregates only approved reviews", async () => {
      const url = `/store/products/${productId}/reviews`
      const review = { rating: 4, content: "Good fit", is_recommended: true }
      await expect(api.post(url, review, storeHeaders)).rejects.toMatchObject({
        response: { status: 401 },
      })
      await expect(
        api.post(url, { ...review, rating: 6 }, customerHeaders)
      ).rejects.toMatchObject({ response: { status: 400 } })
      await expect(
        api.post(
          url,
          { ...review, status: "approved", verified_purchase: true },
          customerHeaders
        )
      ).rejects.toMatchObject({ response: { status: 400 } })
      const created = await api.post(
        `${url}?fields=id,rating,status,customer_id,verified_purchase`,
        review,
        customerHeaders
      )
      expect(created.data.review).toEqual({
        id: expect.any(String),
        rating: 4,
        status: "pending",
        verified_purchase: false,
      })
      const before = await api.get(url, storeHeaders)
      expect(before.data).toMatchObject({
        count: 0,
        reviews: [],
        stats: { total_count: 0, average_rating: 0 },
      })

      const { id } = created.data.review
      const historyUrl = "/store/customers/me/reviews"
      await expect(api.get(historyUrl, storeHeaders)).rejects.toMatchObject({
        response: { status: 401 },
      })
      const history = await api.get(
        `${historyUrl}?fields=id,status,customer_id,metadata`,
        customerHeaders
      )
      expect(history.data).toMatchObject({
        reviews: [{ id, status: "pending" }],
        count: 1,
      })
      expect(history.data.reviews[0]).toEqual({ id, status: "pending" })
      const otherHistory = await api.get(historyUrl, otherCustomerHeaders)
      expect(otherHistory.data).toMatchObject({ reviews: [], count: 0 })

      const adminReview = await api.get(
        `/admin/reviews?status=pending&product_id=${productId}`,
        adminHeaders
      )
      expect(adminReview.data.reviews).toEqual([
        expect.objectContaining({ id, customer_name: "John Doe" }),
      ])
      await api.post(
        `/admin/reviews/${id}`,
        { status: "approved" },
        adminHeaders
      )
      const reviews = await api.get(`${url}?rating=5&limit=1`, storeHeaders)
      expect(reviews.data).toMatchObject({
        count: 0,
        reviews: [],
        stats: {
          total_count: 1,
          average_rating: 4,
          recommendation_percentage: 100,
          distribution: { 4: 1 },
        },
      })
      const approved = await api.get(
        `${url}?fields=id,content,customer_id,metadata`,
        storeHeaders
      )
      expect(approved.data.reviews).toEqual([{ id, content: "Good fit" }])
      const product = await api.get(
        `/store/products/${productId}?fields=id,*reviews`,
        storeHeaders
      )
      expect(product.data.product).not.toHaveProperty("reviews")
      await api.delete(`/admin/reviews/${id}`, adminHeaders)
      expect((await api.get(url, storeHeaders)).data.count).toBe(0)
    })

    it.each(["draft", "other channel", "missing"])(
      "hides %s products from reviews and wishlist writes",
      async (kind) => {
        const id =
          kind === "draft"
            ? draftId
            : kind === "other channel"
              ? hiddenId
              : "missing"
        const url = `/store/products/${id}/reviews`
        await expect(api.get(url, storeHeaders)).rejects.toMatchObject({
          response: { status: 404 },
        })
        await expect(
          api.post(url, { rating: 4, content: "Good fit" }, customerHeaders)
        ).rejects.toMatchObject({ response: { status: 404 } })
        await expect(
          api.post(
            "/store/customers/me/wishlist",
            { product_id: id },
            customerHeaders
          )
        ).rejects.toMatchObject({ response: { status: 404 } })
      }
    )

    it("isolates wishlists by customer, checks variant ownership, and permits removal after unpublishing", async () => {
      const url = "/store/customers/me/wishlist"
      const item = { product_id: productId, variant_id: variantId }
      await expect(api.get(url, storeHeaders)).rejects.toMatchObject({
        response: { status: 401 },
      })
      await expect(api.post(url, item, storeHeaders)).rejects.toMatchObject({
        response: { status: 401 },
      })
      await expect(
        api.post(url, { ...item, variant_id: otherVariantId }, customerHeaders)
      ).rejects.toMatchObject({ response: { status: 400 } })
      const created = await api.post(
        `${url}?fields=id,product.title,variant.id,variant.metadata`,
        item,
        customerHeaders
      )
      const { id } = created.data.wishlist_item
      expect(created.data.wishlist_item).toEqual({
        id,
        product: { title: "Visible product" },
        variant: { id: variantId },
      })
      expect(
        (await api.post(url, item, customerHeaders)).data.wishlist_item.id
      ).toBe(id)
      expect(
        (await api.get(url, otherCustomerHeaders)).data.wishlist_items
      ).toEqual([])
      await expect(
        api.delete(`${url}/${id}`, storeHeaders)
      ).rejects.toMatchObject({ response: { status: 401 } })
      await expect(
        api.delete(`${url}/${id}`, otherCustomerHeaders)
      ).rejects.toMatchObject({ response: { status: 404 } })
      await api.post(
        `/admin/products/${productId}`,
        { status: "draft" },
        adminHeaders
      )
      const after = await api.get(
        `${url}?fields=id,*product,*variant`,
        customerHeaders
      )
      expect(after.data.wishlist_items).toEqual([
        { id, product: null, variant: null },
      ])
      expect((await api.delete(`${url}/${id}`, customerHeaders)).data).toEqual({
        id,
        object: "wishlist_item",
        deleted: true,
      })
      expect((await api.get(url, customerHeaders)).data.wishlist_items).toEqual(
        []
      )
    })
  },
})
