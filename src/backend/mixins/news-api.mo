import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/news";
import NewsLib "../lib/news";

mixin (
  news : Map.Map<Nat, Types.NewsArticle>,
  counter : NewsLib.Counter,
) {
  public func createNewsArticle(article : Types.NewsArticle) : async Nat {
    NewsLib.create(news, counter, article)
  };

  public query func getNewsArticle(id : Nat) : async ?Types.NewsArticle {
    NewsLib.get(news, id)
  };

  public query func listNewsArticles() : async [Types.NewsArticle] {
    NewsLib.list(news)
  };

  public func updateNewsArticleStatus(id : Nat, status : Types.ArticleStatus) : async ?Types.NewsArticle {
    NewsLib.updateStatus(news, id, status)
  };

  public func updateNewsArticle(
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
  ) : async ?Types.NewsArticle {
    NewsLib.update(news, id, headline, subHeadline, body, regionalFocus, relatedCrops, tags, status, scheduledPublishDate, bannerImage)
  };
};
