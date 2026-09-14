import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/production";

module {
  public func addCycle(cycles : Map.Map<Nat, Types.ProductionCycle>, cycle : Types.ProductionCycle) : Nat {
    cycles.add(cycle.id, cycle);
    cycle.id
  };

  public func getCycle(cycles : Map.Map<Nat, Types.ProductionCycle>, id : Nat) : ?Types.ProductionCycle {
    cycles.get(id)
  };

  public func listCycles(cycles : Map.Map<Nat, Types.ProductionCycle>) : [Types.ProductionCycle] {
    cycles.values().toArray()
  };

  public func updateCycle(cycles : Map.Map<Nat, Types.ProductionCycle>, cycle : Types.ProductionCycle) : () {
    cycles.add(cycle.id, cycle);
  };

  public func seed(cycles : Map.Map<Nat, Types.ProductionCycle>) : () {
    cycles.add(1, {
      id = 1;
      crop = "Maize";
      farmField = "Field A";
      areaHa = 5.0;
      expectedYield = 12.0;
      stage = #growing;
      startDate = 1700000000000000000;
      endDate = null;
      status = "active";
    });
    cycles.add(2, {
      id = 2;
      crop = "Soybeans";
      farmField = "Field B";
      areaHa = 3.5;
      expectedYield = 8.0;
      stage = #planting;
      startDate = 1700000000000000000;
      endDate = null;
      status = "active";
    });
    cycles.add(3, {
      id = 3;
      crop = "Tomatoes";
      farmField = "Field C";
      areaHa = 1.2;
      expectedYield = 6.0;
      stage = #harvesting;
      startDate = 1700000000000000000;
      endDate = null;
      status = "active";
    });
  };
};
