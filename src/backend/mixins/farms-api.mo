import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/farms";
import FarmsLib "../lib/farms";

mixin (
  farms : Map.Map<Nat, Types.Farm>,
  crops : Map.Map<Nat, Types.Crop>,
  counter : FarmsLib.Counter,
) {
  public func addFarm(farm : Types.Farm) : async Nat {
    FarmsLib.addFarm(farms, counter, farm)
  };

  public query func getFarm(id : Nat) : async ?Types.Farm {
    FarmsLib.getFarm(farms, id)
  };

  public query func listFarms() : async [Types.Farm] {
    FarmsLib.listFarms(farms)
  };

  public func updateFarm(farm : Types.Farm) : async () {
    FarmsLib.updateFarm(farms, farm);
  };

  public func deleteFarm(id : Nat) : async () {
    FarmsLib.deleteFarm(farms, id);
  };

  public func addCrop(crop : Types.Crop) : async Nat {
    FarmsLib.addCrop(crops, counter, crop)
  };

  public query func getCrop(id : Nat) : async ?Types.Crop {
    FarmsLib.getCrop(crops, id)
  };

  public query func listCrops() : async [Types.Crop] {
    FarmsLib.listCrops(crops)
  };

  public func updateCrop(crop : Types.Crop) : async () {
    FarmsLib.updateCrop(crops, crop);
  };

  public func deleteCrop(id : Nat) : async () {
    FarmsLib.deleteCrop(crops, id);
  };
};
