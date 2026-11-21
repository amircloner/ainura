import { asValue, createContainer } from "@medusajs/framework/awilix"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  OrderStatus,
  Modules,
} from "@medusajs/framework/utils"
import { createProductReviewsWorkflow } from "../../workflows/create-product-reviews"

const review = {
  product_id: "prod_1",
  customer_id: "cus_1",
  customer_name: "Jane",
  rating: 5,
  content: "Good fit",
}

describe("createProductReviewsWorkflow", () => {
  const graph = jest.fn()
  const createProductReviews = jest.fn(async (reviews) =>
    reviews.map((data, index) => ({ ...data, id: `prev_${index}` }))
  )
  const container = createContainer() as unknown as MedusaContainer
  container.register(ContainerRegistrationKeys.QUERY, asValue({ graph }))
  container.register(Modules.PRODUCT, asValue({ createProductReviews }))

  beforeEach(() => jest.clearAllMocks())

  it("verifies only reviews matching a customer's eligible order line", async () => {
    graph.mockResolvedValue({
      data: [
        {
          customer_id: "cus_1",
          items: [
            { product_id: "prod_1", quantity: 1 },
            { product_id: "prod_2", quantity: 0 },
          ],
        },
      ],
    })

    const { result } = await createProductReviewsWorkflow(container).run({
      input: {
        reviews: [
          review,
          { ...review, product_id: "prod_2", verified_purchase: true },
          { ...review, customer_id: "cus_2", verified_purchase: true },
          { ...review, customer_id: null, verified_purchase: true },
        ],
      },
    })

    expect(graph).toHaveBeenCalledTimes(1)
    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "order",
        filters: {
          customer_id: ["cus_1", "cus_2"],
          is_draft_order: false,
          status: { $nin: [OrderStatus.CANCELED, OrderStatus.DRAFT] },
        },
      })
    )
    expect(result.map(({ verified_purchase }) => verified_purchase)).toEqual([
      true,
      false,
      false,
      false,
    ])
  })

  it.each([0, 6, 3.5, NaN])(
    "rejects rating %s before querying or saving",
    async (rating) => {
      const { errors } = await createProductReviewsWorkflow(container).run({
        input: { reviews: [{ ...review, rating }] },
        throwOnError: false,
      })
      expect(errors).toMatchObject([
        {
          error: {
            message: "Review rating must be an integer between 1 and 5",
          },
        },
      ])
      expect(graph).not.toHaveBeenCalled()
      expect(createProductReviews).not.toHaveBeenCalled()
    }
  )
})
