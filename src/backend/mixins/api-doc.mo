mixin () {
  public query func getApiDoc() : async Text {
    "# AgriVision Pro - Backend API\n" #
    "\n" #
    "AgriVision Pro is an agricultural management platform for Malawi. The backend\n" #
    "canister stores farms, crops, production cycles, sales, payments, reports,\n" #
    "news articles, support requests, users, and inventory items, and exposes them\n" #
    "through a Candid API. All monetary values are in Malawian Kwacha (MWK).\n" #
    "\n" #
    "## Authentication and authorization\n" #
    "\n" #
    "The app uses Internet Identity with role-based access control. Every public\n" #
    "method that reads or writes application data requires a signed-in (non-anonymous)\n" #
    "caller. Anonymous callers are treated as guests and cannot access application data.\n" #
    "\n" #
    "Registration happens only when a caller signs in through the app's own frontend\n" #
    "(or calls `_initialize_access_control` once as a signed-in caller). The first\n" #
    "caller to register becomes the admin; every subsequent caller becomes a regular\n" #
    "user. A caller can therefore be unregistered even when it belongs to the app's\n" #
    "owner - registration only occurs through the frontend sign-in flow, and a\n" #
    "signed-in caller derived against a different origin is a different principal\n" #
    "than the one the frontend registered.\n" #
    "\n" #
    "The frontend pins an Internet Identity derivation origin, published at\n" #
    "`/.well-known/ii-derivation-origin` when available. An agent already holding the\n" #
    "user's Internet Identity authorization derives the correct per-app principal\n" #
    "against that origin (for example `icp identity link web <name> --app <host>`).\n" #
    "Such a delegation acts with the user's full authority in this app until it expires.\n" #
    "\n" #
    "### Roles\n" #
    "\n" #
    "- `#admin` - full access; can assign roles to other users.\n" #
    "- `#user` - regular signed-in user.\n" #
    "- `#guest` - anonymous caller.\n" #
    "\n" #
    "### Authorization endpoints\n" #
    "\n" #
    "- `_initialize_access_control() : async ()` - registers the caller. The first\n" #
    "  caller becomes admin; later callers become users. Anonymous callers are ignored.\n" #
    "- `_internet_identity_sign_in_start() : async Blob` - starts the II sign-in flow.\n" #
    "- `_internet_identity_sign_in_finish() : async Result.Result<(), Verify.Error>` -\n" #
    "  completes the II sign-in flow and registers the caller.\n" #
    "- `getCallerUserRole() : async UserRole` - returns the caller's role. Anonymous\n" #
    "  callers get `#guest`. A signed-in but unregistered caller traps with\n" #
    "  `\"User is not registered\"`.\n" #
    "- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` - assigns\n" #
    "  a role. Admin-only; a non-admin caller traps with\n" #
    "  `\"Unauthorized: Only admins can assign user roles\"`.\n" #
    "- `isCallerAdmin() : async Bool` - whether the caller is an admin. Traps for an\n" #
    "  unregistered signed-in caller.\n" #
    "\n" #
    "## Data endpoints\n" #
    "\n" #
    "All data endpoints require a signed-in caller. The backend does not enforce\n" #
    "per-role guards on the domain endpoints themselves; access is gated by the\n" #
    "frontend and by the OQL controller-only authorization described below.\n" #
    "\n" #
    "### Farms and crops\n" #
    "\n" #
    "- `addFarm(farm : Farm) : async Nat` - creates a farm, returns its id.\n" #
    "- `getFarm(id : Nat) : async ?Farm` - returns a farm by id, or `null`.\n" #
    "- `listFarms() : async [Farm]` - lists all farms.\n" #
    "- `updateFarm(farm : Farm) : async ()` - replaces a farm by its `id`.\n" #
    "- `deleteFarm(id : Nat) : async ()` - removes a farm by id.\n" #
    "- `addCrop(crop : Crop) : async Nat` - creates a crop, returns its id.\n" #
    "- `getCrop(id : Nat) : async ?Crop` - returns a crop by id, or `null`.\n" #
    "- `listCrops() : async [Crop]` - lists all crops.\n" #
    "- `updateCrop(crop : Crop) : async ()` - replaces a crop by its `id`.\n" #
    "- `deleteCrop(id : Nat) : async ()` - removes a crop by id.\n" #
    "\n" #
    "### Production cycles\n" #
    "\n" #
    "- `addProductionCycle(cycle : ProductionCycle) : async Nat` - creates a cycle.\n" #
    "- `getProductionCycle(id : Nat) : async ?ProductionCycle` - returns a cycle.\n" #
    "- `listProductionCycles() : async [ProductionCycle]` - lists all cycles.\n" #
    "- `updateProductionCycle(cycle : ProductionCycle) : async ()` - replaces a cycle.\n" #
    "\n" #
    "### Sales, payments, and reports\n" #
    "\n" #
    "- `addSale(sale : Sale) : async Nat` / `getSale(id) : async ?Sale` /\n" #
    "  `listSales() : async [Sale]` / `updateSale(sale : Sale) : async ()`.\n" #
    "- `addPayment(payment : Payment) : async Nat` / `getPayment(id) : async ?Payment` /\n" #
    "  `listPayments() : async [Payment]` / `updatePayment(payment : Payment) : async ()`.\n" #
    "- `addReport(report : Report) : async Nat` / `getReport(id) : async ?Report` /\n" #
    "  `listReports() : async [Report]` / `updateReport(report : Report) : async ()`.\n" #
    "\n" #
    "### News\n" #
    "\n" #
    "- `createNewsArticle(article : NewsArticle) : async Nat` - creates an article.\n" #
    "- `getNewsArticle(id : Nat) : async ?NewsArticle` - returns an article.\n" #
    "- `listNewsArticles() : async [NewsArticle]` - lists all articles.\n" #
    "- `updateNewsArticleStatus(id : Nat, status : ArticleStatus) : async ?NewsArticle`\n" #
    "  - updates an article's status; returns the updated article or `null` if not found.\n" #
    "- `updateNewsArticle(id : Nat, headline : Text, subHeadline : Text, body : Text,\n" #
    "  regionalFocus : RegionalFocus, relatedCrops : [Text], tags : [Text],\n" #
    "  status : ArticleStatus, scheduledPublishDate : ?Int, bannerImage : Text)\n" #
    "  : async ?NewsArticle` - edits an existing article's headline, subheadline,\n" #
    "  body, regional focus (incl. Malawi), related crops, tags, status, scheduled\n" #
    "  publish date, and banner image. Returns the updated article, or `null` if the\n" #
    "  id does not exist. The article's `id`, `featuredOnPage`, and `createdAt` are\n" #
    "  preserved unchanged.\n" #
    "\n" #
    "### Support, users, and inventory\n" #
    "\n" #
    "- `addSupportRequest(request : SupportRequest) : async Nat` /\n" #
    "  `getSupportRequest(id) : async ?SupportRequest` /\n" #
    "  `listSupportRequests() : async [SupportRequest]`.\n" #
    "- `addUser(user : User) : async Nat` / `getUser(id) : async ?User` /\n" #
    "  `listUsers() : async [User]`.\n" #
    "- `addInventoryItem(item : InventoryItem) : async Nat` /\n" #
    "  `getInventoryItem(id) : async ?InventoryItem` /\n" #
    "  `listInventoryItems() : async [InventoryItem]`.\n" #
    "\n" #
    "## OQL data intelligence\n" #
    "\n" #
    "The backend exposes its persisted data through OQL (`schema()` and `execute()`)\n" #
    "so the Caffeine Data Intelligence agent can answer natural-language questions\n" #
    "over the data. Every entity is `controllerOnly()`: only the platform controller\n" #
    "(the agent) reads the rows, and end users do not read them directly. Entities:\n" #
    "`farm`, `crop`, `productionCycle`, `sale`, `payment`, `report`, `newsArticle`,\n" #
    "`supportRequest`, `user`, `inventoryItem`.\n" #
    "\n" #
    "## Units and encodings\n" #
    "\n" #
    "- Timestamps (`date`, `createdAt`, `generatedDate`, `startDate`, `endDate`,\n" #
    "  `lastHarvest`, `scheduledPublishDate`) are `Int` nanoseconds since the Unix\n" #
    "  epoch (`Time.now()`).\n" #
    "- Monetary values (`totalAmount`, `amount`, `unitPrice`) are `Float` MWK.\n" #
    "- Areas (`totalAreaHa`, `areaHa`) and quantities (`quantity`, `expectedYield`,\n" #
    "  `threshold`) are `Float`.\n" #
    "- Identifiers are `Nat` and are unique per collection.\n" #
    "- Optional fields (`lastHarvest`, `image`, `endDate`, `scheduledPublishDate`)\n" #
    "  are `?Int` / `?Text`; `null` means absent.\n" #
    "- Variant fields encode as their tag name (e.g. `FarmStatus` is `#active` /\n" #
    "  `#inactive`; `ArticleStatus` is `#draft` / `#pendingReview` / `#published`).\n" #
    "- List fields (`keyCrops`, `relatedCrops`, `tags`, `featuredOnPage`,\n" #
    "  `attachments`) are `[Text]`.\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "There are no long-running background jobs or polling requirements. All data\n" #
    "endpoints complete synchronously within a single call. `getX` returns `null`\n" #
    "when the id does not exist; `listX` returns the current snapshot.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "`addX` methods assign a fresh id from an internal counter and return it, so\n" #
    "retrying an `addX` call creates a duplicate record with a new id. To make a\n" #
    "mutation idempotent, callers should use `updateX` with a known id instead of\n" #
    "re-adding. `updateX` replaces the record with the matching `id`; `deleteX`\n" #
    "removes it. `updateNewsArticleStatus` is idempotent - setting the same status\n" #
    "twice has no further effect. `updateNewsArticle` is idempotent for a given id -\n" #
    "re-applying the same field values yields the same article; it returns `null`\n" #
    "when the id does not exist, so callers should check the result before assuming\n" #
    "the edit succeeded.\n" #
    "\n" #
    "## Errors, traps, and limits\n" #
    "\n" #
    "- Unregistered signed-in callers trap with `\"User is not registered\"` on\n" #
    "  role-guarded queries.\n" #
    "- Non-admin callers trap with `\"Unauthorized: Only admins can assign user roles\"`\n" #
    "  when calling `assignCallerUserRole`.\n" #
    "- `getX` returns `null` (not an error) for a missing id.\n" #
    "- There is no pagination; `listX` returns the full collection, so very large\n" #
    "  collections may exceed message size limits.\n" #
    "\n" #
    "## Non-obvious gotchas\n" #
    "\n" #
    "- A caller must register (sign in through the frontend or call\n" #
    "  `_initialize_access_control`) before any role-guarded call, including guarded\n" #
    "  queries; otherwise the call traps.\n" #
    "- The first registered caller becomes admin; there is no way to re-assign the\n" #
    "  initial admin except through `assignCallerUserRole` by an existing admin.\n" #
    "- OQL entities are controller-only, so end users cannot query them directly;\n" #
    "  only the Data Intelligence agent can.\n" #
    "- Currency is always MWK; do not interpret monetary fields as another currency."
  };
};
