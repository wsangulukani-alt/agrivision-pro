import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/production";
import ProductionLib "../lib/production";

mixin (cycles : Map.Map<Nat, Types.ProductionCycle>) {
  public func addProductionCycle(cycle : Types.ProductionCycle) : async Nat {
    ProductionLib.addCycle(cycles, cycle)
  };

  public query func getProductionCycle(id : Nat) : async ?Types.ProductionCycle {
    ProductionLib.getCycle(cycles, id)
  };

  public query func listProductionCycles() : async [Types.ProductionCycle] {
    ProductionLib.listCycles(cycles)
  };

  public func updateProductionCycle(cycle : Types.ProductionCycle) : async () {
    ProductionLib.updateCycle(cycles, cycle)
  };
};
