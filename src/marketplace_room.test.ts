import assert from "node:assert/strict";
import { roomPlan } from "./marketplace_room.ts";

const plan = roomPlan({ seller_asset: { id: "asset/42", title: "Camera" }, buyer: { account_id: "buyer-7", display_name: "Mina" } });
assert.equal(plan.roomName, "marketplace-asset-42-buyer-7");
assert.equal(plan.event, "order.handoff.ready");
assert.equal(plan.data.buyer_account_id, "buyer-7");
console.log("marketplace room decision: handoff event is ready");
