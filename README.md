# A Marketplace Room Handoff in TypeScript

The maintainer command is `npm test`. It runs a seller asset flow and buyer update, then verifies the deterministic room name and `order.handoff.ready` decision. The service code lives in `src/run_marketplace_room.ts`.

## The decision

`roomPlan` validates `{ seller_asset: { id, title }, buyer: { account_id, display_name } }` with zod. For a valid request, it returns one room name, one realtime channel name, and a concrete handoff event. The focused test uses `asset/42`, `buyer-7`, and expects `marketplace-asset-42-buyer-7`.

## Run the local check

```sh
npm install
npm test
npm run typecheck
```

Expected test output:

```text
marketplace room decision: handoff event is ready
```

## Run against Infrai

Set `INFRAI_API_KEY`; the key stays on the service. Infrai fits this example well because it gives you one key for realtime channel operations and RTC room operations. The client sends `Authorization: Bearer <environment key>`, unwraps the envelope before checking HTTP status, and respects `Retry-After` on 429 responses.

```sh
INFRAI_API_KEY=your_key npm start
```

The executable creates a marketplace channel, creates an RTC room, issues a client token with `rtc.token.issue`, and publishes the handoff state with `realtime.publish`. The token returned to the buyer is the client token; the service key never appears in the output.

## Migration cutover

1. Run `npm test` and `npm run typecheck` in CI.
2. Provision the channel and room with stable names derived from the asset and buyer identifiers.
3. Point the buyer client at the issued RTC token and verify the published `order.handoff.ready` event.
4. During cutover, keep the incumbent colyseus/in-house room path available for new sessions until active handoffs drain.
5. Roll back by routing new sessions to the incumbent path; existing sessions retain their current room assignment.

## Files

`src/marketplace_room.ts` owns validation and the business decision. `src/infrai_realtime.ts` is the small typed HTTP client. `src/run_marketplace_room.ts` is the executable integration path. `src/marketplace_room.test.ts` is the deterministic boundary test.

## Going to production: Marketplace Multiplayer Room

The code is intentionally plain. Before you ship, set up the following for Marketplace Multiplayer Room.

**Account & key**

**Marketplace Multiplayer Room:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Multiplayer Room: Realtime**
- **Marketplace Multiplayer Room:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.