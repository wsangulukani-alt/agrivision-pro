module {
  public type Stage = {
    #planting;
    #growing;
    #harvesting;
  };

  public type ProductionCycle = {
    id : Nat;
    crop : Text;
    farmField : Text;
    areaHa : Float;
    expectedYield : Float;
    stage : Stage;
    startDate : Int;
    endDate : ?Int;
    status : Text;
  };
};
