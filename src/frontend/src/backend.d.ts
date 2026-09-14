import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Report {
    id: bigint;
    status: ReportStatus;
    name: string;
    reportType: ReportType;
    locationFarm: string;
    generatedDate: bigint;
}
export interface InventoryItem {
    id: bigint;
    status: InventoryStatus;
    threshold: number;
    name: string;
    unit: string;
    quantity: number;
}
export interface ProductionCycle {
    id: bigint;
    status: string;
    endDate?: bigint;
    crop: string;
    farmField: string;
    stage: Stage;
    areaHa: number;
    startDate: bigint;
    expectedYield: number;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface Farm {
    id: bigint;
    status: FarmStatus;
    manager: string;
    name: string;
    totalAreaHa: number;
    keyCrops: Array<string>;
    location: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface User {
    id: bigint;
    name: string;
    role: string;
    email: string;
}
export interface Crop {
    id: bigint;
    cultivationPractices: string;
    farm: bigint;
    name: string;
    harvestingYields: string;
    lastHarvest?: bigint;
    description: string;
    areaHa: number;
    image?: string;
    pestsDiseases: string;
}
export interface Payment {
    id: bigint;
    status: PaymentStatus;
    date: bigint;
    description: string;
    amount: number;
}
export interface Sale {
    id: bigint;
    crop: string;
    date: bigint;
    farm: string;
    totalAmount: number;
    quantity: number;
    buyer: string;
    unitPrice: number;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface SupportRequest {
    id: bigint;
    status: SupportStatus;
    subject: string;
    createdAt: bigint;
    description: string;
    category: string;
    priority: SupportPriority;
    attachments: Array<string>;
}
export interface NewsArticle {
    id: bigint;
    status: ArticleStatus;
    featuredOnPage: Array<string>;
    body: string;
    headline: string;
    createdAt: bigint;
    regionalFocus: RegionalFocus;
    tags: Array<string>;
    relatedCrops: Array<string>;
    scheduledPublishDate?: bigint;
    subHeadline: string;
    bannerImage: string;
}
export enum ArticleStatus {
    pendingReview = "pendingReview",
    published = "published",
    draft = "draft"
}
export enum FarmStatus {
    active = "active",
    inactive = "inactive"
}
export enum InventoryStatus {
    inStock = "inStock",
    critical = "critical",
    lowStock = "lowStock"
}
export enum PaymentStatus {
    pending = "pending",
    processed = "processed"
}
export enum RegionalFocus {
    sadc = "sadc",
    global = "global",
    malawi = "malawi"
}
export enum ReportStatus {
    saved = "saved",
    generated = "generated"
}
export enum ReportType {
    soil = "soil",
    market = "market",
    fieldActivity = "fieldActivity",
    yield_ = "yield"
}
export enum Stage {
    growing = "growing",
    harvesting = "harvesting",
    planting = "planting"
}
export enum SupportPriority {
    important = "important",
    urgent = "urgent"
}
export enum SupportStatus {
    resolved = "resolved",
    closed = "closed",
    open = "open",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCrop(crop: Crop): Promise<bigint>;
    addFarm(farm: Farm): Promise<bigint>;
    addInventoryItem(item: InventoryItem): Promise<bigint>;
    addPayment(payment: Payment): Promise<bigint>;
    addProductionCycle(cycle: ProductionCycle): Promise<bigint>;
    addReport(report: Report): Promise<bigint>;
    addSale(sale: Sale): Promise<bigint>;
    addSupportRequest(request: SupportRequest): Promise<bigint>;
    addUser(user: User): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createNewsArticle(article: NewsArticle): Promise<bigint>;
    deleteCrop(id: bigint): Promise<void>;
    deleteFarm(id: bigint): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getCrop(id: bigint): Promise<Crop | null>;
    getFarm(id: bigint): Promise<Farm | null>;
    getInventoryItem(id: bigint): Promise<InventoryItem | null>;
    getNewsArticle(id: bigint): Promise<NewsArticle | null>;
    getPayment(id: bigint): Promise<Payment | null>;
    getProductionCycle(id: bigint): Promise<ProductionCycle | null>;
    getReport(id: bigint): Promise<Report | null>;
    getSale(id: bigint): Promise<Sale | null>;
    getSupportRequest(id: bigint): Promise<SupportRequest | null>;
    getUser(id: bigint): Promise<User | null>;
    isCallerAdmin(): Promise<boolean>;
    listCrops(): Promise<Array<Crop>>;
    listFarms(): Promise<Array<Farm>>;
    listInventoryItems(): Promise<Array<InventoryItem>>;
    listNewsArticles(): Promise<Array<NewsArticle>>;
    listPayments(): Promise<Array<Payment>>;
    listProductionCycles(): Promise<Array<ProductionCycle>>;
    listReports(): Promise<Array<Report>>;
    listSales(): Promise<Array<Sale>>;
    listSupportRequests(): Promise<Array<SupportRequest>>;
    listUsers(): Promise<Array<User>>;
    schema(): Promise<string>;
    updateCrop(crop: Crop): Promise<void>;
    updateFarm(farm: Farm): Promise<void>;
    updateNewsArticle(id: bigint, headline: string, subHeadline: string, body: string, regionalFocus: RegionalFocus, relatedCrops: Array<string>, tags: Array<string>, status: ArticleStatus, scheduledPublishDate: bigint | null, bannerImage: string): Promise<NewsArticle | null>;
    updateNewsArticleStatus(id: bigint, status: ArticleStatus): Promise<NewsArticle | null>;
    updatePayment(payment: Payment): Promise<void>;
    updateProductionCycle(cycle: ProductionCycle): Promise<void>;
    updateReport(report: Report): Promise<void>;
    updateSale(sale: Sale): Promise<void>;
}
