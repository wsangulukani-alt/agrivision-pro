module {
  public type UserId = Principal;
  public type Timestamp = Int;

  public type User = {
    id : UserId;
    name : Text;
    role : Text;
    farmId : ?Nat;
  };

  public type InventoryItem = {
    id : Nat;
    name : Text;
    quantity : Float;
    unit : Text;
    farmId : Nat;
  };
};
