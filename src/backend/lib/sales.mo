import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/sales";

module {
  public type Counter = {
    var nextSaleId : Nat;
    var nextPaymentId : Nat;
    var nextReportId : Nat;
  };

  // ---- Sales ----
  public func addSale(sales : Map.Map<Nat, Types.Sale>, counter : Counter, sale : Types.Sale) : Nat {
    let id = counter.nextSaleId;
    counter.nextSaleId += 1;
    sales.add(id, { sale with id = id });
    id
  };

  public func getSale(sales : Map.Map<Nat, Types.Sale>, id : Nat) : ?Types.Sale {
    sales.get(id)
  };

  public func listSales(sales : Map.Map<Nat, Types.Sale>) : [Types.Sale] {
    sales.values().toArray()
  };

  public func updateSale(sales : Map.Map<Nat, Types.Sale>, sale : Types.Sale) : () {
    sales.add(sale.id, sale);
  };

  // ---- Payments ----
  public func addPayment(payments : Map.Map<Nat, Types.Payment>, counter : Counter, payment : Types.Payment) : Nat {
    let id = counter.nextPaymentId;
    counter.nextPaymentId += 1;
    payments.add(id, { payment with id = id });
    id
  };

  public func getPayment(payments : Map.Map<Nat, Types.Payment>, id : Nat) : ?Types.Payment {
    payments.get(id)
  };

  public func listPayments(payments : Map.Map<Nat, Types.Payment>) : [Types.Payment] {
    payments.values().toArray()
  };

  public func updatePayment(payments : Map.Map<Nat, Types.Payment>, payment : Types.Payment) : () {
    payments.add(payment.id, payment);
  };

  // ---- Reports ----
  public func addReport(reports : Map.Map<Nat, Types.Report>, counter : Counter, report : Types.Report) : Nat {
    let id = counter.nextReportId;
    counter.nextReportId += 1;
    reports.add(id, { report with id = id });
    id
  };

  public func getReport(reports : Map.Map<Nat, Types.Report>, id : Nat) : ?Types.Report {
    reports.get(id)
  };

  public func listReports(reports : Map.Map<Nat, Types.Report>) : [Types.Report] {
    reports.values().toArray()
  };

  public func updateReport(reports : Map.Map<Nat, Types.Report>, report : Types.Report) : () {
    reports.add(report.id, report);
  };
};
