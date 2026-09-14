import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/news";

module {
  public type Counter = {
    var nextId : Nat;
  };

  public func create(news : Map.Map<Nat, Types.NewsArticle>, counter : Counter, article : Types.NewsArticle) : Nat {
    let id = counter.nextId;
    counter.nextId += 1;
    news.add(id, { article with id = id });
    id
  };

  public func get(news : Map.Map<Nat, Types.NewsArticle>, id : Nat) : ?Types.NewsArticle {
    news.get(id)
  };

  public func list(news : Map.Map<Nat, Types.NewsArticle>) : [Types.NewsArticle] {
    news.values().toArray()
  };

  public func updateStatus(news : Map.Map<Nat, Types.NewsArticle>, id : Nat, status : Types.ArticleStatus) : ?Types.NewsArticle {
    switch (news.get(id)) {
      case (?a) {
        let updated = { a with status = status };
        news.add(id, updated);
        ?updated
      };
      case null { null };
    };
  };

  public func update(
    news : Map.Map<Nat, Types.NewsArticle>,
    id : Nat,
    headline : Text,
    subHeadline : Text,
    body : Text,
    regionalFocus : Types.RegionalFocus,
    relatedCrops : [Text],
    tags : [Text],
    status : Types.ArticleStatus,
    scheduledPublishDate : ?Int,
    bannerImage : Text,
  ) : ?Types.NewsArticle {
    switch (news.get(id)) {
      case (?a) {
        let updated : Types.NewsArticle = {
          id = a.id;
          headline;
          subHeadline;
          bannerImage;
          regionalFocus;
          body;
          relatedCrops;
          tags;
          status;
          scheduledPublishDate;
          featuredOnPage = a.featuredOnPage;
          createdAt = a.createdAt;
        };
        news.add(id, updated);
        ?updated
      };
      case null { null };
    };
  };
};
