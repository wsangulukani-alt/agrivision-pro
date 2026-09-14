import List "mo:core/List";
import Types "../types/support";

module {
  public func addSupportRequest(requests : List.List<Types.SupportRequest>, nextId : { var value : Nat }, request : Types.SupportRequest) : Nat {
    let id = nextId.value;
    nextId.value += 1;
    requests.add({ request with id = id });
    id
  };

  public func getSupportRequest(requests : List.List<Types.SupportRequest>, id : Nat) : ?Types.SupportRequest {
    requests.find(func r = r.id == id)
  };

  public func listSupportRequests(requests : List.List<Types.SupportRequest>) : [Types.SupportRequest] {
    requests.toArray()
  };

  public func addUser(users : List.List<Types.User>, nextId : { var value : Nat }, user : Types.User) : Nat {
    let id = nextId.value;
    nextId.value += 1;
    users.add({ user with id = id });
    id
  };

  public func getUser(users : List.List<Types.User>, id : Nat) : ?Types.User {
    users.find(func u = u.id == id)
  };

  public func listUsers(users : List.List<Types.User>) : [Types.User] {
    users.toArray()
  };

  public func addInventoryItem(items : List.List<Types.InventoryItem>, nextId : { var value : Nat }, item : Types.InventoryItem) : Nat {
    let id = nextId.value;
    nextId.value += 1;
    items.add({ item with id = id });
    id
  };

  public func getInventoryItem(items : List.List<Types.InventoryItem>, id : Nat) : ?Types.InventoryItem {
    items.find(func i = i.id == id)
  };

  public func listInventoryItems(items : List.List<Types.InventoryItem>) : [Types.InventoryItem] {
    items.toArray()
  };
};
