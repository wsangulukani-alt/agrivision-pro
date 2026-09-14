module {
  public type RegionalFocus = {
    #malawi;
    #sadc;
    #global;
  };

  public type ArticleStatus = {
    #draft;
    #pendingReview;
    #published;
  };

  public type NewsArticle = {
    id : Nat;
    headline : Text;
    subHeadline : Text;
    bannerImage : Text;
    regionalFocus : RegionalFocus;
    body : Text;
    relatedCrops : [Text];
    tags : [Text];
    status : ArticleStatus;
    scheduledPublishDate : ?Int;
    featuredOnPage : [Text];
    createdAt : Int;
  };
};
