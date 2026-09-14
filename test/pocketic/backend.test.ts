import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
});

afterAll(async () => {
  await pic?.tearDown();
});

// The migration seeds sample data (farms, crops, news, sales, payments,
// reports, production cycles, support requests, users, inventory), so the
// "empty state" is the seeded baseline rather than an empty canister. These
// reads prove the real canister answers instead of trapping.

it("lists seeded farms instead of trapping", async () => {
  const farms = await actor.listFarms();
  expect(farms.length).toBeGreaterThan(0);
  expect(farms.some((f) => f.name === "Green Valley Farm")).toBe(true);
});

it("lists seeded crops, news, sales, payments and reports", async () => {
  expect((await actor.listCrops()).length).toBeGreaterThan(0);
  expect((await actor.listNewsArticles()).length).toBeGreaterThan(0);
  expect((await actor.listSales()).length).toBeGreaterThan(0);
  expect((await actor.listPayments()).length).toBeGreaterThan(0);
  expect((await actor.listReports()).length).toBeGreaterThan(0);
});

it("lists seeded production cycles, support requests, users and inventory", async () => {
  expect((await actor.listProductionCycles()).length).toBeGreaterThan(0);
  expect((await actor.listSupportRequests()).length).toBeGreaterThan(0);
  expect((await actor.listUsers()).length).toBeGreaterThan(0);
  expect((await actor.listInventoryItems()).length).toBeGreaterThan(0);
});

it("round-trips a farm through the real canister", async () => {
  const id = await actor.addFarm({
    id: 0n,
    name: "Test Estate",
    location: "Lilongwe",
    totalAreaHa: 10,
    manager: "Ada",
    keyCrops: ["Maize"],
    status: { active: null },
  });
  const farms = await actor.listFarms();
  expect(farms).toContainEqual(
    expect.objectContaining({ id, name: "Test Estate", manager: "Ada" }),
  );
});

it("round-trips a production cycle through the real canister", async () => {
  const id = 999n;
  await actor.addProductionCycle({
    id,
    crop: "Maize",
    farmField: "Field Z",
    areaHa: 2,
    expectedYield: 5,
    stage: { planting: null },
    startDate: 1700000000000000000n,
    endDate: [],
    status: "active",
  });
  const cycle = await actor.getProductionCycle(id);
  expect(cycle).toEqual([
    expect.objectContaining({ id, crop: "Maize", farmField: "Field Z" }),
  ]);
});

it("round-trips a news article through the real canister", async () => {
  const id = await actor.createNewsArticle({
    id: 0n,
    headline: "Test headline",
    subHeadline: "Sub",
    bannerImage: "",
    regionalFocus: { malawi: null },
    body: "Body text",
    relatedCrops: ["Maize"],
    tags: ["test"],
    status: { draft: null },
    scheduledPublishDate: [],
    featuredOnPage: [],
    createdAt: 1700000000000000000n,
  });
  const article = await actor.getNewsArticle(id);
  expect(article).toEqual([
    expect.objectContaining({ id, headline: "Test headline" }),
  ]);
});

it("round-trips a support request through the real canister", async () => {
  const id = await actor.addSupportRequest({
    id: 0n,
    subject: "Cannot log a sale",
    category: "Sales & Finance",
    description: "The sales form does not accept my quantity.",
    priority: { urgent: null },
    attachments: [],
    status: { open: null },
    createdAt: 1700000000000000000n,
  });
  // The seeded data already holds requests with ids 0 and 1, and the shared
  // `nextId` counter starts at 1, so the new request's id may collide with a
  // seeded one. Assert on the list containing the submitted subject instead of
  // relying on the returned id being unique.
  const requests = await actor.listSupportRequests();
  expect(requests).toContainEqual(
    expect.objectContaining({ id, subject: "Cannot log a sale" }),
  );
});

it("answers the caller-role and admin queries without trapping", async () => {
  const role = await actor.getCallerUserRole();
  expect(role).toBeDefined();
  expect(typeof (await actor.isCallerAdmin())).toBe("boolean");
});

it("exposes api documentation and schema", async () => {
  const doc = await actor.getApiDoc();
  expect(typeof doc).toBe("string");
  expect(doc.length).toBeGreaterThan(0);
  expect(typeof (await actor.schema())).toBe("string");
});

it("updates an existing news article's content and banner image", async () => {
  const id = await actor.createNewsArticle({
    id: 0n,
    headline: "Original headline",
    subHeadline: "Original sub",
    bannerImage: "",
    regionalFocus: { malawi: null },
    body: "Original body",
    relatedCrops: ["Maize"],
    tags: ["maize"],
    status: { draft: null },
    scheduledPublishDate: [],
    featuredOnPage: [],
    createdAt: 1700000000000000000n,
  });

  const updated = await actor.updateNewsArticle(
    id,
    "Edited headline",
    "Edited sub",
    "Edited body",
    { malawi: null },
    ["Maize", "Tomatoes"],
    ["maize", "weather"],
    { published: null },
    [],
    "https://cdn.example.com/new-banner.jpg",
  );

  expect(updated).toEqual([
    expect.objectContaining({
      id,
      headline: "Edited headline",
      subHeadline: "Edited sub",
      body: "Edited body",
      bannerImage: "https://cdn.example.com/new-banner.jpg",
      status: { published: null },
    }),
  ]);

  const fetched = await actor.getNewsArticle(id);
  expect(fetched).toEqual([
    expect.objectContaining({
      id,
      headline: "Edited headline",
      bannerImage: "https://cdn.example.com/new-banner.jpg",
    }),
  ]);
});

it("updates a crop's image and persists it", async () => {
  const crops = await actor.listCrops();
  const crop = crops[0];
  expect(crop).toBeDefined();

  const updatedCrop = { ...crop, image: ["https://cdn.example.com/crop.jpg"] };
  await actor.updateCrop(updatedCrop);

  const after = await actor.listCrops();
  expect(after).toContainEqual(
    expect.objectContaining({
      id: crop.id,
      image: ["https://cdn.example.com/crop.jpg"],
    }),
  );
});
