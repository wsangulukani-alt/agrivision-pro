import List "mo:core/List";
import Types "../types/support";
import SupportLib "../lib/support";

mixin (
  supportRequests : List.List<Types.SupportRequest>,
  users : List.List<Types.User>,
  inventory : List.List<Types.InventoryItem>,
  nextId : { var value : Nat }
) {
  public func addSupportRequest(request : Types.SupportRequest) : async Nat {
    SupportLib.addSupportRequest(supportRequests, nextId, request)
  };

  public query func getSupportRequest(id : Nat) : async ?Types.SupportRequest {
    SupportLib.getSupportRequest(supportRequests, id)
  };

  public query func listSupportRequests() : async [Types.SupportRequest] {
    SupportLib.listSupportRequests(supportRequests)
  };

  public func addUser(user : Types.User) : async Nat {
    SupportLib.addUser(users, nextId, user)
  };

  public query func getUser(id : Nat) : async ?Types.User {
    SupportLib.getUser(users, id)
  };

  public query func listUsers() : async [Types.User] {
    SupportLib.listUsers(users)
  };

  public func addInventoryItem(item : Types.InventoryItem) : async Nat {
    SupportLib.addInventoryItem(inventory, nextId, item)
  };

  public query func getInventoryItem(id : Nat) : async ?Types.InventoryItem {
    SupportLib.getInventoryItem(inventory, id)
  };

  public query func listInventoryItems() : async [Types.InventoryItem] {
    SupportLib.listInventoryItems(inventory)
  };
};
