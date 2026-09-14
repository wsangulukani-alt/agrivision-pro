import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/farms";

module {
  public type Counter = {
    var nextFarmId : Nat;
    var nextCropId : Nat;
  };

  public func addFarm(farms : Map.Map<Nat, Types.Farm>, counter : Counter, farm : Types.Farm) : Nat {
    let id = counter.nextFarmId;
    counter.nextFarmId += 1;
    farms.add(id, { farm with id = id });
    id
  };

  public func getFarm(farms : Map.Map<Nat, Types.Farm>, id : Nat) : ?Types.Farm {
    farms.get(id)
  };

  public func listFarms(farms : Map.Map<Nat, Types.Farm>) : [Types.Farm] {
    farms.values().toArray()
  };

  public func updateFarm(farms : Map.Map<Nat, Types.Farm>, farm : Types.Farm) : () {
    farms.add(farm.id, farm);
  };

  public func deleteFarm(farms : Map.Map<Nat, Types.Farm>, id : Nat) : () {
    farms.remove(id);
  };

  public func addCrop(crops : Map.Map<Nat, Types.Crop>, counter : Counter, crop : Types.Crop) : Nat {
    let id = counter.nextCropId;
    counter.nextCropId += 1;
    crops.add(id, { crop with id = id });
    id
  };

  public func getCrop(crops : Map.Map<Nat, Types.Crop>, id : Nat) : ?Types.Crop {
    crops.get(id)
  };

  public func listCrops(crops : Map.Map<Nat, Types.Crop>) : [Types.Crop] {
    crops.values().toArray()
  };

  public func updateCrop(crops : Map.Map<Nat, Types.Crop>, crop : Types.Crop) : () {
    crops.add(crop.id, crop);
  };

  public func deleteCrop(crops : Map.Map<Nat, Types.Crop>, id : Nat) : () {
    crops.remove(id);
  };
};
