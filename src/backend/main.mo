import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Types "types/farms";
import FarmsLib "lib/farms";
import FarmsApi "mixins/farms-api";
import NewsTypes "types/news";
import NewsLib "lib/news";
import NewsApi "mixins/news-api";
import SalesTypes "types/sales";
import SalesLib "lib/sales";
import SalesApi "mixins/sales-api";
import ProductionTypes "types/production";
import ProductionApi "mixins/production-api";
import SupportTypes "types/support";
import SupportApi "mixins/support-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let farms : Map.Map<Nat, Types.Farm>;
  let crops : Map.Map<Nat, Types.Crop>;
  let counter : FarmsLib.Counter;
  let news : Map.Map<Nat, NewsTypes.NewsArticle>;
  let newsCounter : NewsLib.Counter;
  let sales : Map.Map<Nat, SalesTypes.Sale>;
  let payments : Map.Map<Nat, SalesTypes.Payment>;
  let reports : Map.Map<Nat, SalesTypes.Report>;
  let salesCounter : SalesLib.Counter;
  let cycles : Map.Map<Nat, ProductionTypes.ProductionCycle>;
  let supportRequests : List.List<SupportTypes.SupportRequest>;
  let users : List.List<SupportTypes.User>;
  let inventory : List.List<SupportTypes.InventoryItem>;
  let nextId : { var value : Nat };
  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();
  include FarmsApi(farms, crops, counter);
  include NewsApi(news, newsCounter);
  include SalesApi(sales, payments, reports, salesCounter);
  include ProductionApi(cycles);
  include SupportApi(supportRequests, users, inventory, nextId);
  include ApiDocMixin();
  include Expose({
    entities = [
      farms.toEntityManual("farm", "Farm", "id")
        .sample({ id = 0; name = ""; location = ""; totalAreaHa = 0.0; manager = ""; keyCrops = []; status = #active })
        .payload("id", func f = f.id)
        .payload("name", func f = f.name)
        .payload("location", func f = f.location)
        .payload("totalAreaHa", func f = f.totalAreaHa)
        .payload("manager", func f = f.manager)
        .payload("keyCrops", func f = f.keyCrops.values().join(", "))
        .payload("status", func f = switch (f.status) { case (#active) "active"; case (#inactive) "inactive" })
        .controllerOnly()
        .build(),
      crops.toEntityManual("crop", "Crop", "id")
        .sample({ id = 0; name = ""; description = ""; cultivationPractices = ""; pestsDiseases = ""; harvestingYields = ""; farm = 0; areaHa = 0.0; lastHarvest = null; image = null })
        .payload("id", func c = c.id)
        .payload("name", func c = c.name)
        .payload("description", func c = c.description)
        .payload("cultivationPractices", func c = c.cultivationPractices)
        .payload("pestsDiseases", func c = c.pestsDiseases)
        .payload("harvestingYields", func c = c.harvestingYields)
        .payload("farm", func c = c.farm).edge("farm", "farm")
        .payload("areaHa", func c = c.areaHa)
        .payload("lastHarvest", func c = switch (c.lastHarvest) { case (?t) t; case null 0 })
        .payload("image", func c = switch (c.image) { case (?i) i; case null "" })
        .controllerOnly()
        .build(),
      cycles.toEntityManual("productionCycle", "ProductionCycle", "id")
        .sample({ id = 0; crop = ""; farmField = ""; areaHa = 0.0; expectedYield = 0.0; stage = #planting; startDate = 0; endDate = null; status = "" })
        .payload("id", func c = c.id)
        .payload("crop", func c = c.crop)
        .payload("farmField", func c = c.farmField)
        .payload("areaHa", func c = c.areaHa)
        .payload("expectedYield", func c = c.expectedYield)
        .payload("stage", func c = switch (c.stage) { case (#planting) "planting"; case (#growing) "growing"; case (#harvesting) "harvesting" })
        .payload("startDate", func c = c.startDate)
        .payload("endDate", func c = switch (c.endDate) { case (?d) d; case null 0 })
        .payload("status", func c = c.status)
        .controllerOnly()
        .build(),
      sales.toEntity("sale", "Sale", "id")
        .sample({ id = 0; crop = ""; farm = ""; quantity = 0.0; unitPrice = 0.0; totalAmount = 0.0; date = 0; buyer = "" })
        .controllerOnly()
        .build(),
      payments.toEntityManual("payment", "Payment", "id")
        .sample({ id = 0; amount = 0.0; status = #pending; date = 0; description = "" })
        .payload("id", func p = p.id)
        .payload("amount", func p = p.amount)
        .payload("status", func p = switch (p.status) { case (#pending) "pending"; case (#processed) "processed" })
        .payload("date", func p = p.date)
        .payload("description", func p = p.description)
        .controllerOnly()
        .build(),
      reports.toEntityManual("report", "Report", "id")
        .sample({ id = 0; name = ""; reportType = #yield; generatedDate = 0; status = #generated; locationFarm = "" })
        .payload("id", func r = r.id)
        .payload("name", func r = r.name)
        .payload("reportType", func r = switch (r.reportType) { case (#yield) "yield"; case (#soil) "soil"; case (#market) "market"; case (#fieldActivity) "fieldActivity" })
        .payload("generatedDate", func r = r.generatedDate)
        .payload("status", func r = switch (r.status) { case (#generated) "generated"; case (#saved) "saved" })
        .payload("locationFarm", func r = r.locationFarm)
        .controllerOnly()
        .build(),
      news.toEntityManual("newsArticle", "NewsArticle", "id")
        .sample({ id = 0; headline = ""; subHeadline = ""; bannerImage = ""; regionalFocus = #malawi; body = ""; relatedCrops = []; tags = []; status = #draft; scheduledPublishDate = null; featuredOnPage = []; createdAt = 0 })
        .payload("id", func n = n.id)
        .payload("headline", func n = n.headline)
        .payload("subHeadline", func n = n.subHeadline)
        .payload("bannerImage", func n = n.bannerImage)
        .payload("regionalFocus", func n = switch (n.regionalFocus) { case (#malawi) "malawi"; case (#sadc) "sadc"; case (#global) "global" })
        .payload("body", func n = n.body)
        .payload("relatedCrops", func n = n.relatedCrops.values().join(", "))
        .payload("tags", func n = n.tags.values().join(", "))
        .payload("status", func n = switch (n.status) { case (#draft) "draft"; case (#pendingReview) "pendingReview"; case (#published) "published" })
        .payload("scheduledPublishDate", func n = switch (n.scheduledPublishDate) { case (?d) d; case null 0 })
        .payload("featuredOnPage", func n = n.featuredOnPage.values().join(", "))
        .payload("createdAt", func n = n.createdAt)
        .controllerOnly()
        .build(),
      supportRequests.toEntityManual("supportRequest", "SupportRequest", "id")
        .sample({ id = 0; subject = ""; category = ""; description = ""; priority = #urgent; attachments = []; status = #open; createdAt = 0 })
        .payload("id", func s = s.id)
        .payload("subject", func s = s.subject)
        .payload("category", func s = s.category)
        .payload("description", func s = s.description)
        .payload("priority", func s = switch (s.priority) { case (#urgent) "urgent"; case (#important) "important" })
        .payload("attachments", func s = s.attachments.values().join(", "))
        .payload("status", func s = switch (s.status) { case (#open) "open"; case (#inProgress) "inProgress"; case (#resolved) "resolved"; case (#closed) "closed" })
        .payload("createdAt", func s = s.createdAt)
        .controllerOnly()
        .build(),
      users.toEntity("user", "User", "id")
        .sample({ id = 0; name = ""; role = ""; email = "" })
        .controllerOnly()
        .build(),
      inventory.toEntityManual("inventoryItem", "InventoryItem", "id")
        .sample({ id = 0; name = ""; quantity = 0.0; unit = ""; status = #inStock; threshold = 0.0 })
        .payload("id", func i = i.id)
        .payload("name", func i = i.name)
        .payload("quantity", func i = i.quantity)
        .payload("unit", func i = i.unit)
        .payload("status", func i = switch (i.status) { case (#inStock) "inStock"; case (#lowStock) "lowStock"; case (#critical) "critical" })
        .payload("threshold", func i = i.threshold)
        .controllerOnly()
        .build(),
    ];
  });
};
