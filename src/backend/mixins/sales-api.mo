import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/sales";
import SalesLib "../lib/sales";

mixin (
  sales : Map.Map<Nat, Types.Sale>,
  payments : Map.Map<Nat, Types.Payment>,
  reports : Map.Map<Nat, Types.Report>,
  counter : SalesLib.Counter,
) {
  // ---- Sales ----
  public func addSale(sale : Types.Sale) : async Nat {
    SalesLib.addSale(sales, counter, sale)
  };

  public query func getSale(id : Nat) : async ?Types.Sale {
    SalesLib.getSale(sales, id)
  };

  public query func listSales() : async [Types.Sale] {
    SalesLib.listSales(sales)
  };

  public func updateSale(sale : Types.Sale) : async () {
    SalesLib.updateSale(sales, sale);
  };

  // ---- Payments ----
  public func addPayment(payment : Types.Payment) : async Nat {
    SalesLib.addPayment(payments, counter, payment)
  };

  public query func getPayment(id : Nat) : async ?Types.Payment {
    SalesLib.getPayment(payments, id)
  };

  public query func listPayments() : async [Types.Payment] {
    SalesLib.listPayments(payments)
  };

  public func updatePayment(payment : Types.Payment) : async () {
    SalesLib.updatePayment(payments, payment);
  };

  // ---- Reports ----
  public func addReport(report : Types.Report) : async Nat {
    SalesLib.addReport(reports, counter, report)
  };

  public query func getReport(id : Nat) : async ?Types.Report {
    SalesLib.getReport(reports, id)
  };

  public query func listReports() : async [Types.Report] {
    SalesLib.listReports(reports)
  };

  public func updateReport(report : Types.Report) : async () {
    SalesLib.updateReport(reports, report);
  };
};
