import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../../helpers/create-admin-user"

jest.setTimeout(60000)
process.env.ENABLE_RBAC_MODULE = "true"

medusaIntegrationTestRunner({
  testSuite: ({ api, dbConnection, dbUtils, getContainer }) => {
    const reader = { headers: { ...adminHeaders.headers } }
    const noAccess = { headers: { ...adminHeaders.headers } }
    let brandId: string
    let productId: string
    let reviewId: string

    beforeAll(async () => {
      const container = getContainer()
      await createAdminUser(dbConnection, adminHeaders, container)
      const rbac = container.resolve(Modules.RBAC)
      const role = await rbac.createRbacRoles({ name: "Fashion reader" })
      for (const key of ["product_brand:read", "product_review:read"]) {
        const [policy] = await rbac.listRbacPolicies({ key })
        expect(policy).toBeDefined()
        await rbac.createRbacRolePolicies({
          role_id: role.id,
          policy_id: policy.id,
        })
      }
      await createAdminUser(dbConnection, reader, container, {
        email: "fashion-reader@example.com",
        roles: [role.id],
      })
      await createAdminUser(dbConnection, noAccess, container, {
        email: "fashion-no-access@example.com",
        roles: [],
      })

      const products = container.resolve(Modules.PRODUCT)
      const [brand] = await products.createProductBrands([
        { name: "New brand", handle: "new-brand" },
      ])
      brandId = brand.id
      const product = await products.createProducts({ title: "Test product" })
      productId = product.id
      const [review] = await products.createProductReviews([
        {
          product_id: productId,
          customer_name: "Test customer",
          rating: 4,
          content: "Good fit",
          status: "pending",
        },
      ])
      reviewId = review.id
      await dbUtils.snapshot()
    })

    it("requires the corresponding read policies for list and detail routes", async () => {
      for (const url of [
        "/admin/brands",
        `/admin/brands/${brandId}`,
        "/admin/reviews",
        `/admin/reviews/${reviewId}`,
      ]) {
        await expect(api.get(url, noAccess)).rejects.toMatchObject({
          response: { status: 403 },
        })
        await expect(api.get(url, reader)).resolves.toMatchObject({
          status: 200,
        })
      }
    })

    it("forbids writes with read-only policies", async () => {
      for (const [method, url, data] of [
        ["POST", "/admin/brands", { name: "Forbidden" }],
        ["POST", `/admin/brands/${brandId}`, { name: "Forbidden" }],
        ["DELETE", `/admin/brands/${brandId}`],
        ["POST", `/admin/reviews/${reviewId}`, { status: "approved" }],
        ["DELETE", `/admin/reviews/${reviewId}`],
      ] as const) {
        await expect(
          api.request({ method, url, data, ...reader })
        ).rejects.toMatchObject({ response: { status: 403 } })
      }
    })

    it("supports brand CRUD and product assignment for an authorized admin", async () => {
      const created = await api.post(
        "/admin/brands",
        { name: "Second brand" },
        adminHeaders
      )
      const { id } = created.data.brand
      const updated = await api.post(
        `/admin/brands/${id}`,
        { name: "Renamed brand" },
        adminHeaders
      )
      expect(updated.data.brand.name).toBe("Renamed brand")
      await api.post(
        `/admin/products/${productId}`,
        { brand_id: id },
        adminHeaders
      )
      const detail = await api.get(
        `/admin/products/${productId}?fields=+brand.id,+brand.name`,
        adminHeaders
      )
      expect(detail.data.product).toMatchObject({
        brand_id: id,
        brand: { id, name: "Renamed brand" },
      })
      await api.post(
        `/admin/products/${productId}`,
        { brand_id: null },
        adminHeaders
      )
      expect(
        (await api.delete(`/admin/brands/${id}`, adminHeaders)).data
      ).toEqual({ id, object: "brand", deleted: true })
    })
  },
})
