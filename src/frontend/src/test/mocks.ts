import type {
  Crop,
  Farm,
  InventoryItem,
  NewsArticle,
  Payment,
  ProductionCycle,
  Report,
  Sale,
  SupportRequest,
  User,
} from "@/backend";
import {
  ArticleStatus,
  FarmStatus,
  InventoryStatus,
  PaymentStatus,
  RegionalFocus,
  ReportStatus,
  ReportType,
  Stage,
  UserRole,
} from "@/backend";
import { vi } from "vitest";

/**
 * A typed mock of the backend actor surface the pages consume. Each method is
 * a `vi.fn` so tests can assert on calls and control return values. The actor
 * is returned by the mocked `useActor` hook.
 */
export function createMockActor() {
  return {
    listFarms: vi.fn<() => Promise<Farm[]>>(async () => []),
    addFarm: vi.fn<() => Promise<bigint>>(async () => 1n),
    updateFarm: vi.fn<() => Promise<void>>(async () => undefined),
    deleteFarm: vi.fn<() => Promise<void>>(async () => undefined),
    listCrops: vi.fn<() => Promise<Crop[]>>(async () => []),
    listSales: vi.fn<() => Promise<Sale[]>>(async () => []),
    addSale: vi.fn<() => Promise<bigint>>(async () => 1n),
    listPayments: vi.fn<() => Promise<Payment[]>>(async () => []),
    addPayment: vi.fn<() => Promise<bigint>>(async () => 1n),
    listReports: vi.fn<() => Promise<Report[]>>(async () => []),
    addReport: vi.fn<() => Promise<bigint>>(async () => 1n),
    listProductionCycles: vi.fn<() => Promise<ProductionCycle[]>>(
      async () => [],
    ),
    addProductionCycle: vi.fn<() => Promise<bigint>>(async () => 1n),
    updateProductionCycle: vi.fn<() => Promise<void>>(async () => undefined),
    listNewsArticles: vi.fn<() => Promise<NewsArticle[]>>(async () => []),
    createNewsArticle: vi.fn<() => Promise<bigint>>(async () => 1n),
    updateNewsArticle: vi.fn<
      (
        id: bigint,
        headline: string,
        subHeadline: string,
        body: string,
        regionalFocus: RegionalFocus,
        relatedCrops: string[],
        tags: string[],
        status: ArticleStatus,
        scheduledPublishDate: bigint | null,
        bannerImage: string,
      ) => Promise<NewsArticle | null>
    >(async () => null),
    updateCrop: vi.fn<(crop: Crop) => Promise<void>>(async () => undefined),
    listInventoryItems: vi.fn<() => Promise<InventoryItem[]>>(async () => []),
    addInventoryItem: vi.fn<() => Promise<bigint>>(async () => 1n),
    listUsers: vi.fn<() => Promise<User[]>>(async () => []),
    addUser: vi.fn<() => Promise<bigint>>(async () => 1n),
    addSupportRequest: vi.fn<() => Promise<bigint>>(async () => 1n),
    listSupportRequests: vi.fn<() => Promise<SupportRequest[]>>(async () => []),
    getCallerUserRole: vi.fn<() => Promise<UserRole>>(
      async () => UserRole.admin,
    ),
    isCallerAdmin: vi.fn<() => Promise<boolean>>(async () => true),
    assignCallerUserRole: vi.fn<() => Promise<void>>(async () => undefined),
  };
}

export type MockActor = ReturnType<typeof createMockActor>;

/** A sample farm used across page tests. */
export function sampleFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: 1n,
    name: "Lilongwe Central Estate",
    location: "Lilongwe, Central Region",
    totalAreaHa: 120,
    manager: "Grace Banda",
    keyCrops: ["Maize", "Soybean"],
    status: FarmStatus.active,
    ...overrides,
  };
}

export function sampleSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 1n,
    crop: "Maize",
    farm: "Lilongwe Farm",
    buyer: "GreenFields Co-op",
    quantity: 100,
    unitPrice: 450,
    totalAmount: 45000,
    date: BigInt(Date.now()) * 1_000_000n,
    ...overrides,
  };
}

export function samplePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 1n,
    amount: 150000,
    status: PaymentStatus.pending,
    date: BigInt(Date.now()) * 1_000_000n,
    description: "Maize sale from GreenFields Co-op",
    ...overrides,
  };
}

export function sampleReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 1n,
    name: "Yield Report — Lilongwe Central Farm",
    reportType: ReportType.yield_,
    locationFarm: "Lilongwe Central Farm",
    status: ReportStatus.generated,
    generatedDate: BigInt(Date.now()) * 1_000_000n,
    ...overrides,
  };
}

export function sampleCycle(
  overrides: Partial<ProductionCycle> = {},
): ProductionCycle {
  return {
    id: 1n,
    crop: "Maize",
    farmField: "Central Region - Field A",
    stage: Stage.growing,
    status: "Active",
    areaHa: 12.5,
    expectedYield: 45,
    startDate: BigInt(Date.now() - 30 * 86400000) * 1_000_000n,
    ...overrides,
  };
}

export function sampleArticle(
  overrides: Partial<NewsArticle> = {},
): NewsArticle {
  return {
    id: 1n,
    headline: "Malawi maize harvest expected to rise 12% this season",
    subHeadline: "Favorable rains support a strong harvest",
    body: "Farmers across the Central Region report healthy crops.",
    status: ArticleStatus.published,
    regionalFocus: RegionalFocus.malawi,
    tags: ["maize", "harvest"],
    relatedCrops: ["Maize"],
    featuredOnPage: [],
    bannerImage: "",
    createdAt: BigInt(Date.now()) * 1_000_000n,
    ...overrides,
  };
}

export function sampleInventoryItem(
  overrides: Partial<InventoryItem> = {},
): InventoryItem {
  return {
    id: 1n,
    name: "Fertilizer (NPK)",
    quantity: 120,
    unit: "bags",
    status: InventoryStatus.inStock,
    threshold: 20,
    ...overrides,
  };
}
