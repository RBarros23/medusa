import { WorkflowArguments } from "../../helper"

type HandlerInputData = {
  line_items: {
    items?: Record<any, any>[]
  }
  cart: {
    id: string
    customer_id: string
    region_id: string
  }
}

enum Aliases {
  LineItems = "line_items",
  Cart = "cart",
}

export async function attachLineItemsToCart({
  container,
  context,
  data,
}: WorkflowArguments<HandlerInputData>): Promise<void> {
  const featureFlagRouter = container.resolve("featureFlagRouter")
  const lineItemService = container.resolve("lineItemService")
  const cartService = container.resolve("cartService")
  const entityManager = container.resolve("manager")
  const lineItemServiceTx = lineItemService.withTransaction(entityManager)
  const cartServiceTx = cartService.withTransaction(entityManager)
  let lineItems = data[Aliases.LineItems].items
  const cart = data[Aliases.Cart]

  if (lineItems?.length) {
    const generateInputData = lineItems.map((item) => ({
      variantId: item.variant_id,
      quantity: item.quantity,
    }))

    lineItems = await lineItemServiceTx.generate(generateInputData, {
      region_id: cart.region_id,
      customer_id: cart.customer_id,
    })

    await cartServiceTx.addOrUpdateLineItems(cart.id, lineItems, {
      validateSalesChannels:
        featureFlagRouter.isFeatureEnabled("sales_channels"),
    })
  }
}

attachLineItemsToCart.aliases = Aliases
