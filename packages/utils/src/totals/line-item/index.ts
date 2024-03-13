import { TaxLineDTO } from "@medusajs/types"
import { BigNumber } from "../big-number"
import { MathBN } from "../math"
import { calculateTaxTotal } from "../tax"

interface GetLineItemsTotalsContext {
  includeTax?: boolean
}

interface GetItemTotalInput {
  id: string
  unit_price: BigNumber
  quantity: number
  is_tax_inclusive?: boolean
  tax_lines?: TaxLineDTO[]
}

interface GetItemTotalOutput {
  quantity: number
  unit_price: BigNumber

  subtotal: BigNumber
  total: BigNumber
  original_total: BigNumber
  discount_total: BigNumber
  tax_total: BigNumber
  original_tax_total: BigNumber
}

export function getLineItemsTotals(
  items: GetItemTotalInput[],
  context: GetLineItemsTotalsContext
): { [itemId: string]: GetItemTotalOutput } {
  const itemsTotals: { [itemId: string]: GetItemTotalOutput } = {}

  for (const item of items) {
    itemsTotals[item.id] = getLineItemTotals(item, {
      includeTax: context.includeTax,
    })
  }

  return itemsTotals
}

function getLineItemTotals(
  item: GetItemTotalInput,
  context: GetLineItemsTotalsContext
) {
  const subtotal = MathBN.mult(item.unit_price, item.quantity)

  // TODO: Account for discount
  const discountTotal = MathBN.convert(0)

  const taxTotal = MathBN.convert(0)
  const originalTaxTotal = MathBN.convert(0)

  const total = MathBN.sub(subtotal, discountTotal)

  const totals: GetItemTotalOutput = {
    quantity: item.quantity,
    unit_price: item.unit_price,

    subtotal: new BigNumber(subtotal),
    total: new BigNumber(total),
    original_total: new BigNumber(subtotal),
    discount_total: new BigNumber(discountTotal),
    tax_total: new BigNumber(taxTotal),
    original_tax_total: new BigNumber(originalTaxTotal),
  }

  const taxLines = item.tax_lines || []
  const taxableAmount = subtotal // TODO: Substract discount amount

  const newTaxTotal = calculateTaxTotal({
    taxLines,
    includesTax: context.includeTax,
    taxableAmount,
  })

  totals.tax_total = new BigNumber(newTaxTotal)
  // TODO: Calculate original tax total by excluding discounts
  totals.original_tax_total = new BigNumber(newTaxTotal)

  const isTaxInclusive = context.includeTax ?? item.is_tax_inclusive

  if (isTaxInclusive) {
    const subtotal = MathBN.sub(
      MathBN.mult(item.unit_price, totals.quantity),
      originalTaxTotal
    )

    const subtotalBn = new BigNumber(subtotal)
    totals.subtotal = subtotalBn
    totals.total = subtotalBn
    totals.original_total = subtotalBn
  } else {
    const newTotal = MathBN.add(total, taxTotal)
    const originalTotal = MathBN.add(subtotal, originalTaxTotal)
    totals.total = new BigNumber(newTotal)
    totals.original_total = new BigNumber(originalTotal)
  }

  return totals
}
