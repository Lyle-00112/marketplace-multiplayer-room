import { InfraiRealtimeClient } from "./infrai_realtime.ts";
import { roomPlan, marketplaceRequest } from "./marketplace_room.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

const request = marketplaceRequest.parse({
  seller_asset: { id: process.env.SELLER_ASSET_ID ?? "asset-42", title: process.env.SELLER_ASSET_TITLE ?? "Demo asset" },
  buyer: { account_id: process.env.BUYER_ACCOUNT_ID ?? "buyer-7", display_name: process.env.BUYER_DISPLAY_NAME ?? "Buyer" }
});
const plan = roomPlan(request);
const client = new InfraiRealtimeClient(key);
const channel = await client.createChannel({ channel: plan.channelName, type: "public" });
const room = await client.createRoom({ name: plan.roomName, max_participants: 2, empty_timeout_s: 300, region: "auto" });
const buyerToken = await client.issueRtcToken({ room: room.room ?? plan.roomName, identity: request.buyer.account_id, display_name: request.buyer.display_name, ttl_s: 900, can_publish: true, can_subscribe: true });
await client.publish({ channel: channel.channel ?? plan.channelName, event: plan.event, data: plan.data, account_id: request.buyer.account_id });
console.log(JSON.stringify({ room: room.room ?? plan.roomName, channel: channel.channel ?? plan.channelName, handoff: plan.data, client_token_issued: Boolean(buyerToken.token) }, null, 2));
