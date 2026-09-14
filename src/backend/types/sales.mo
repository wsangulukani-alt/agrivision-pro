module {
  public type Sale = {
    id : Nat;
    crop : Text;
    farm : Text;
    quantity : Float;
    unitPrice : Float;
    totalAmount : Float; // MWK
    date : Int;
    buyer : Text;
  };

  public type PaymentStatus = {
    #pending;
    #processed;
  };

  public type Payment = {
    id : Nat;
    amount : Float; // MWK
    status : PaymentStatus;
    date : Int;
    description : Text;
  };

  public type ReportType = {
    #yield;
    #soil;
    #market;
    #fieldActivity;
  };

  public type ReportStatus = {
    #generated;
    #saved;
  };

  public type Report = {
    id : Nat;
    name : Text;
    reportType : ReportType;
    generatedDate : Int;
    status : ReportStatus;
    locationFarm : Text;
  };
};
