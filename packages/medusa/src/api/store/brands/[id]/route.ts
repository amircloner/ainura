import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { queryStoreBrands } from "../helpers"

export const GET = async (
  req: MedusaStoreRequest<unknown, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreBrandResponse>
) => {
  const {
    data: [brand],
  } = await queryStoreBrands(req, { id: req.params.id })

  if (!brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with id: ${req.params.id} was not found`
    )
  }

  res.status(200).json({ brand })
}
