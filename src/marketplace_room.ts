import { z } from "zod";

export const marketplaceRequest = z.object({
  seller_asset: z.object({ id: z.string().min(1), title: z.string().min(1) }),
  buyer: z.object({ account_id: z.string().min(1), display_name: z.string().min(1) })
});

export type MarketplaceRequest = z.infer<typeof marketplaceRequest>;

export function roomPlan(input: MarketplaceRequest) {
  const parsed = marketplaceRequest.parse(input);
  const slug = `${parsed.seller_asset.id}-${parsed.buyer.account_id}`.replace(/[^a-zA-Z0-9-]/g, "-");
  return {
    roomName: `marketplace-${slug}`,
    channelName: `marketplace-${slug}-state`,
    event: "order.handoff.ready",
    data: { asset_id: parsed.seller_asset.id, asset_title: parsed.seller_asset.title, buyer_account_id: parsed.buyer.account_id }
  };
}
