module {
  public type SupportPriority = {
    #urgent;
    #important;
  };

  public type SupportStatus = {
    #open;
    #inProgress;
    #resolved;
    #closed;
  };

  public type SupportRequest = {
    id : Nat;
    subject : Text;
    category : Text;
    description : Text;
    priority : SupportPriority;
    attachments : [Text];
    status : SupportStatus;
    createdAt : Int;
  };

  public type User = {
    id : Nat;
    name : Text;
    role : Text;
    email : Text;
  };

  public type InventoryStatus = {
    #inStock;
    #lowStock;
    #critical;
  };

  public type InventoryItem = {
    id : Nat;
    name : Text;
    quantity : Float;
    unit : Text;
    status : InventoryStatus;
    threshold : Float;
  };
};
