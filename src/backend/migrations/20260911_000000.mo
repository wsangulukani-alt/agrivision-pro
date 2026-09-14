import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  type FarmStatus = {
    #active;
    #inactive;
  };

  type Farm = {
    id : Nat;
    name : Text;
    location : Text;
    totalAreaHa : Float;
    manager : Text;
    keyCrops : [Text];
    status : FarmStatus;
  };

  type Crop = {
    id : Nat;
    name : Text;
    description : Text;
    cultivationPractices : Text;
    pestsDiseases : Text;
    harvestingYields : Text;
    farm : Nat;
    areaHa : Float;
    lastHarvest : ?Int;
    image : ?Text;
  };

  type Counter = {
    var nextFarmId : Nat;
    var nextCropId : Nat;
  };

  type RegionalFocus = { #malawi; #sadc; #global };
  type ArticleStatus = { #draft; #pendingReview; #published };
  type NewsArticle = {
    id : Nat;
    headline : Text;
    subHeadline : Text;
    bannerImage : Text;
    regionalFocus : RegionalFocus;
    body : Text;
    relatedCrops : [Text];
    tags : [Text];
    status : ArticleStatus;
    scheduledPublishDate : ?Int;
    featuredOnPage : [Text];
    createdAt : Int;
  };

  type NewsCounter = {
    var nextId : Nat;
  };

  type Sale = {
    id : Nat;
    crop : Text;
    farm : Text;
    quantity : Float;
    unitPrice : Float;
    totalAmount : Float;
    date : Int;
    buyer : Text;
  };

  type PaymentStatus = {
    #pending;
    #processed;
  };

  type Payment = {
    id : Nat;
    amount : Float;
    status : PaymentStatus;
    date : Int;
    description : Text;
  };

  type ReportType = {
    #yield;
    #soil;
    #market;
    #fieldActivity;
  };

  type ReportStatus = {
    #generated;
    #saved;
  };

  type Report = {
    id : Nat;
    name : Text;
    reportType : ReportType;
    generatedDate : Int;
    status : ReportStatus;
    locationFarm : Text;
  };

  type SalesCounter = {
    var nextSaleId : Nat;
    var nextPaymentId : Nat;
    var nextReportId : Nat;
  };

  type ProductionStage = {
    #planting;
    #growing;
    #harvesting;
  };

  type ProductionCycle = {
    id : Nat;
    crop : Text;
    farmField : Text;
    areaHa : Float;
    expectedYield : Float;
    stage : ProductionStage;
    startDate : Int;
    endDate : ?Int;
    status : Text;
  };

  type SupportPriority = {
    #urgent;
    #important;
  };

  type SupportStatus = {
    #open;
    #inProgress;
    #resolved;
    #closed;
  };

  type SupportRequest = {
    id : Nat;
    subject : Text;
    category : Text;
    description : Text;
    priority : SupportPriority;
    attachments : [Text];
    status : SupportStatus;
    createdAt : Int;
  };

  type SupportUser = {
    id : Nat;
    name : Text;
    role : Text;
    email : Text;
  };

  type InventoryStatus = {
    #inStock;
    #lowStock;
    #critical;
  };

  type InventoryItem = {
    id : Nat;
    name : Text;
    quantity : Float;
    unit : Text;
    status : InventoryStatus;
    threshold : Float;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    farms : Map.Map<Nat, Farm>;
    crops : Map.Map<Nat, Crop>;
    counter : Counter;
    news : Map.Map<Nat, NewsArticle>;
    newsCounter : NewsCounter;
    sales : Map.Map<Nat, Sale>;
    payments : Map.Map<Nat, Payment>;
    reports : Map.Map<Nat, Report>;
    salesCounter : SalesCounter;
    cycles : Map.Map<Nat, ProductionCycle>;
    supportRequests : List.List<SupportRequest>;
    users : List.List<SupportUser>;
    inventory : List.List<InventoryItem>;
    nextId : { var value : Nat };
  };

  public func migration(_old : OldActor) : NewActor {
    let farms = Map.empty<Nat, Farm>();
    let crops = Map.empty<Nat, Crop>();
    let counter : Counter = { var nextFarmId = 0; var nextCropId = 0 };

    // Seed sample farms
    let greenValley : Farm = {
      id = counter.nextFarmId;
      name = "Green Valley Farm";
      location = "Lilongwe";
      totalAreaHa = 120.0;
      manager = "John Banda";
      keyCrops = ["Maize", "Tomatoes"];
      status = #active;
    };
    counter.nextFarmId += 1;
    farms.add(greenValley.id, greenValley);

    let mchinji : Farm = {
      id = counter.nextFarmId;
      name = "Mchinji Estate";
      location = "Mchinji";
      totalAreaHa = 85.5;
      manager = "Grace Phiri";
      keyCrops = ["Tobacco", "Rice"];
      status = #active;
    };
    counter.nextFarmId += 1;
    farms.add(mchinji.id, mchinji);

    // Seed sample crops
    let maize : Crop = {
      id = counter.nextCropId;
      name = "Maize";
      description = "Staple cereal crop grown across Malawi.";
      cultivationPractices = "Plant at the start of the rainy season; apply basal and top dressing fertilizer.";
      pestsDiseases = "Fall armyworm, maize streak virus.";
      harvestingYields = "Harvest when cobs are dry; average 4-6 tonnes per hectare.";
      farm = greenValley.id;
      areaHa = 60.0;
      lastHarvest = null;
      image = null;
    };
    counter.nextCropId += 1;
    crops.add(maize.id, maize);

    let tomatoes : Crop = {
      id = counter.nextCropId;
      name = "Tomatoes";
      description = "High-value horticultural crop for local markets.";
      cultivationPractices = "Irrigated production with staking and pruning.";
      pestsDiseases = "Late blight, whitefly.";
      harvestingYields = "Multiple harvests over the season; 20-30 tonnes per hectare.";
      farm = greenValley.id;
      areaHa = 15.0;
      lastHarvest = null;
      image = null;
    };
    counter.nextCropId += 1;
    crops.add(tomatoes.id, tomatoes);

    let tobacco : Crop = {
      id = counter.nextCropId;
      name = "Tobacco (Malawi Gold)";
      description = "Burley tobacco, a key export crop for Malawi.";
      cultivationPractices = "Raised seedbeds, transplanting, topping and reaping.";
      pestsDiseases = "Aphids, tobacco mosaic virus.";
      harvestingYields = "Reaped in stages; 1.5-2.5 tonnes per hectare.";
      farm = mchinji.id;
      areaHa = 40.0;
      lastHarvest = null;
      image = null;
    };
    counter.nextCropId += 1;
    crops.add(tobacco.id, tobacco);

    let rice : Crop = {
      id = counter.nextCropId;
      name = "Rice (NERICA)";
      description = "Upland rice variety suited to rain-fed conditions.";
      cultivationPractices = "Direct seeding or transplanting in well-drained fields.";
      pestsDiseases = "Rice blast, stem borers.";
      harvestingYields = "Harvest when grains are golden; 3-4 tonnes per hectare.";
      farm = mchinji.id;
      areaHa = 20.0;
      lastHarvest = null;
      image = null;
    };
    counter.nextCropId += 1;
    crops.add(rice.id, rice);

    // Seed sample news articles
    let news = Map.empty<Nat, NewsArticle>();
    let newsCounter : NewsCounter = { var nextId = 1 };
    let now = Time.now();

    let irrigation : NewsArticle = {
      id = newsCounter.nextId;
      headline = "New Solar-Powered Irrigation Grants Announced for Malawian Smallholders";
      subHeadline = "Government-backed scheme to boost dry-season farming across the central region";
      bannerImage = "";
      regionalFocus = #malawi;
      body = "A new grant programme will help smallholder farmers install solar-powered irrigation systems, extending the growing season and improving resilience to dry spells across Malawi's central region.";
      relatedCrops = ["maize", "tomatoes"];
      tags = ["irrigation", "grants", "solar"];
      status = #published;
      scheduledPublishDate = null;
      featuredOnPage = ["home"];
      createdAt = now;
    };
    newsCounter.nextId += 1;
    news.add(irrigation.id, irrigation);

    let armyworm : NewsArticle = {
      id = newsCounter.nextId;
      headline = "Fall Armyworm Outbreak Potential Identified in Salima District";
      subHeadline = "Extension officers urge early scouting and integrated pest management";
      bannerImage = "";
      regionalFocus = #malawi;
      body = "Monitoring teams have flagged elevated fall armyworm activity in Salima District. Farmers are advised to scout fields weekly and apply integrated pest management measures early.";
      relatedCrops = ["maize"];
      tags = ["pests", "armyworm", "advisory"];
      status = #published;
      scheduledPublishDate = null;
      featuredOnPage = ["home"];
      createdAt = now;
    };
    newsCounter.nextId += 1;
    news.add(armyworm.id, armyworm);

    let soybean : NewsArticle = {
      id = newsCounter.nextId;
      headline = "Global Soybean Futures Dip Following Brazilian Harvest";
      subHeadline = "Record South American output weighs on international prices";
      bannerImage = "";
      regionalFocus = #global;
      body = "Soybean futures eased this week as Brazil's bumper harvest reached export markets, pressuring international prices and offering buyers more favourable terms.";
      relatedCrops = ["soybean"];
      tags = ["markets", "soybean", "prices"];
      status = #published;
      scheduledPublishDate = null;
      featuredOnPage = [];
      createdAt = now;
    };
    newsCounter.nextId += 1;
    news.add(soybean.id, soybean);

    // Seed sample sales
    let sales = Map.empty<Nat, Sale>();
    let payments = Map.empty<Nat, Payment>();
    let reports = Map.empty<Nat, Report>();
    let salesCounter : SalesCounter = { var nextSaleId = 0; var nextPaymentId = 0; var nextReportId = 0 };

    let sale1 : Sale = {
      id = salesCounter.nextSaleId;
      crop = "Maize";
      farm = "Green Valley Farm";
      quantity = 500.0;
      unitPrice = 300.0;
      totalAmount = 150000.0;
      date = now;
      buyer = "ADMARC";
    };
    salesCounter.nextSaleId += 1;
    sales.add(sale1.id, sale1);

    let sale2 : Sale = {
      id = salesCounter.nextSaleId;
      crop = "Tomatoes";
      farm = "Green Valley Farm";
      quantity = 200.0;
      unitPrice = 800.0;
      totalAmount = 160000.0;
      date = now;
      buyer = "Lilongwe Market";
    };
    salesCounter.nextSaleId += 1;
    sales.add(sale2.id, sale2);

    let sale3 : Sale = {
      id = salesCounter.nextSaleId;
      crop = "Tobacco (Malawi Gold)";
      farm = "Mchinji Estate";
      quantity = 120.0;
      unitPrice = 2500.0;
      totalAmount = 300000.0;
      date = now;
      buyer = "Auction Holdings";
    };
    salesCounter.nextSaleId += 1;
    sales.add(sale3.id, sale3);

    // Seed sample payments
    let payment1 : Payment = {
      id = salesCounter.nextPaymentId;
      amount = 150000.0;
      status = #processed;
      date = now;
      description = "Payment for maize sale to ADMARC";
    };
    salesCounter.nextPaymentId += 1;
    payments.add(payment1.id, payment1);

    let payment2 : Payment = {
      id = salesCounter.nextPaymentId;
      amount = 160000.0;
      status = #pending;
      date = now;
      description = "Payment for tomato sale to Lilongwe Market";
    };
    salesCounter.nextPaymentId += 1;
    payments.add(payment2.id, payment2);

    let payment3 : Payment = {
      id = salesCounter.nextPaymentId;
      amount = 300000.0;
      status = #processed;
      date = now;
      description = "Payment for tobacco sale to Auction Holdings";
    };
    salesCounter.nextPaymentId += 1;
    payments.add(payment3.id, payment3);

    // Seed sample reports
    let report1 : Report = {
      id = salesCounter.nextReportId;
      name = "Maize Yield Report";
      reportType = #yield;
      generatedDate = now;
      status = #saved;
      locationFarm = "Green Valley Farm";
    };
    salesCounter.nextReportId += 1;
    reports.add(report1.id, report1);

    let report2 : Report = {
      id = salesCounter.nextReportId;
      name = "Soil Analysis - Mchinji";
      reportType = #soil;
      generatedDate = now;
      status = #generated;
      locationFarm = "Mchinji Estate";
    };
    salesCounter.nextReportId += 1;
    reports.add(report2.id, report2);

    let report3 : Report = {
      id = salesCounter.nextReportId;
      name = "Market Price Report";
      reportType = #market;
      generatedDate = now;
      status = #saved;
      locationFarm = "Lilongwe";
    };
    salesCounter.nextReportId += 1;
    reports.add(report3.id, report3);

    // Seed sample production cycles
    let cycles = Map.empty<Nat, ProductionCycle>();

    let cycle1 : ProductionCycle = {
      id = 1;
      crop = "Maize";
      farmField = "Field A";
      areaHa = 5.0;
      expectedYield = 12.0;
      stage = #growing;
      startDate = now;
      endDate = null;
      status = "active";
    };
    cycles.add(cycle1.id, cycle1);

    let cycle2 : ProductionCycle = {
      id = 2;
      crop = "Soybeans";
      farmField = "Field B";
      areaHa = 3.5;
      expectedYield = 8.0;
      stage = #planting;
      startDate = now;
      endDate = null;
      status = "active";
    };
    cycles.add(cycle2.id, cycle2);

    let cycle3 : ProductionCycle = {
      id = 3;
      crop = "Tomatoes";
      farmField = "Field C";
      areaHa = 1.2;
      expectedYield = 6.0;
      stage = #harvesting;
      startDate = now;
      endDate = null;
      status = "active";
    };
    cycles.add(cycle3.id, cycle3);

    // Seed sample support data
    let supportRequests = List.empty<SupportRequest>();
    let users = List.empty<SupportUser>();
    let inventory = List.empty<InventoryItem>();
    let nextId : { var value : Nat } = { var value = 1 };

    let support1 : SupportRequest = {
      id = 0;
      subject = "Irrigation pump not working";
      category = "Equipment";
      description = "The irrigation pump at Green Valley Farm is not starting.";
      priority = #urgent;
      attachments = [];
      status = #open;
      createdAt = now;
    };
    supportRequests.add(support1);

    let support2 : SupportRequest = {
      id = 1;
      subject = "Fertilizer delivery delay";
      category = "Logistics";
      description = "Expected fertilizer delivery has not arrived at Mchinji Estate.";
      priority = #important;
      attachments = [];
      status = #inProgress;
      createdAt = now;
    };
    supportRequests.add(support2);

    let user1 : SupportUser = {
      id = 0;
      name = "Arthur";
      role = "Super Admin";
      email = "arthur@agrivision.mw";
    };
    users.add(user1);

    let user2 : SupportUser = {
      id = 1;
      name = "Grace Phiri";
      role = "Farm Manager";
      email = "grace@mchinji.mw";
    };
    users.add(user2);

    let item1 : InventoryItem = {
      id = 0;
      name = "Maize Seed";
      quantity = 500.0;
      unit = "kg";
      status = #inStock;
      threshold = 100.0;
    };
    inventory.add(item1);

    let item2 : InventoryItem = {
      id = 1;
      name = "Fertilizer";
      quantity = 40.0;
      unit = "bags";
      status = #lowStock;
      threshold = 50.0;
    };
    inventory.add(item2);

    let item3 : InventoryItem = {
      id = 2;
      name = "Diesel";
      quantity = 120.0;
      unit = "litres";
      status = #critical;
      threshold = 200.0;
    };
    inventory.add(item3);

    {
      accessControlState = AccessControl.initState();
      farms;
      crops;
      counter;
      news;
      newsCounter;
      sales;
      payments;
      reports;
      salesCounter;
      cycles;
      supportRequests;
      users;
      inventory;
      nextId;
    };
  };
};
