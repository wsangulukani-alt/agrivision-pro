module {
  public type FarmStatus = {
    #active;
    #inactive;
  };

  public type Farm = {
    id : Nat;
    name : Text;
    location : Text;
    totalAreaHa : Float;
    manager : Text;
    keyCrops : [Text];
    status : FarmStatus;
  };

  public type Crop = {
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
};
