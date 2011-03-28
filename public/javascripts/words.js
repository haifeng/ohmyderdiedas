// Every time the leo page is shown we want to refresh
// the IFrame that points to leo dictionary
$('#dict').live('pageshow',function(event){
  var word = $("#word-play-link").text();
  var url = "http://pda.leo.org/?lp=ende&lang=de&searchLoc=0&cmpType=relaxed&relink=off&sectHdr=on&spellToler=&search=" + word;
  $("iframe").attr('src', url);
});

$('#page_sets_manage').live('pagecreate',function(event){

  // Source of words. Generates JSON data of
  // the form
  //
  // { word: "Mann", article: "der" }
  var PlayWord = Backbone.Model.extend({

    initialize: function() {
      this.set({message: null});
      this.resetCorrect();
      _.bindAll(this, "resetCorrect")
    }

    , resetCorrect: function(){
      this.set({correct_answer: true });
    }

    ,url: function(){
      return $("#word-play-view").data('url');
    }

    ,setAnswer: function (article){
      txt = article + " " + this.get('word');
      if (article == this.get('article')){
        this.set(
          { message: {state:true, message: "Richtig!"}
          });
        this.save({},{ success: this.resetCorrect});
      }else{
        this.set(
          { message: {state:false, message: "Falsch"}
          , correct_answer: false
          });
      }
    }

  });

  var PlayView = Backbone.View.extend({

    word: new PlayWord()

    , initialize: function() {
      this.bindModel();
      this.word.fetch();
    }
  
    // ---------------------
    // Model Event Handling
    // ---------------------

    , bindModel: function(){
      _.bindAll(this, "renderMessage", "changeWord");

      this.word.bind('change:message', this.renderMessage);
      this.word.bind('change:word', this.changeWord);
      this.word.bind('change:score', this.changeWord);

    }


    ,changeWord: function(){
        var self = this;
        $("#word-play-link").slideUp(100, function(){
          $("#word-play-link").text(self.word.get('word'));
          $("#word-play-score").html("(" + self.word.get('score') + ")");
          $("#word-play-link").slideDown();
        });
    }

    , renderMessage: function(){
        $("#word-play-message").html(this.word.get('message').message);
        if(this.word.get('message').state){
          $("#word-play-message").removeClass("incorrect");
          $("#word-play-message").addClass("correct");
        }else{
          $("#word-play-message").removeClass("correct");
          $("#word-play-message").addClass("incorrect");
        }
    }


    // ------------------
    // UI Event Handling
    // ------------------

    , events: {  "click .der a" : "handleDer" ,
                 "click .die a" : "handleDie" ,
                 "click .das a" : "handleDas" ,
              }

    , handleDer: function(e) {
      this.word.setAnswer('der');
      this.flashMessage();
    }
    , handleDie: function(e) {
      this.word.setAnswer('die');
      this.flashMessage();
    }
    , handleDas: function(e) {
      this.word.setAnswer('das');
      this.flashMessage();
    }
    , flashMessage: function() {

        $("#word-play-message").fadeOut(100, function(){
          $("#word-play-message").fadeIn(100);
        });

    }
  });


  var Word = Backbone.Model.extend({
  });

  var WordView = Backbone.View.extend({
    tagName: "li"
    ,render: function() {
      $(this.el).html(this.model.get('article') + " " + this.model.get('word'));
      $(this.el).addClass(this.model.get('article'));
      return this;
    },
  }
  );

  var Words = Backbone.Collection.extend({
    model: Word
    ,url: 'word'
  }
  );

  var WordAddView = Backbone.View.extend({
    initialize:function(){
      _.bindAll(this, "onSuccess", "onError");
    }
                 
    , events: {"submit form" : "addItem"}

    , addItem : function(data){
        this.model.create
         ( { word: this.el.find("input").val() }
         , { success: this.onSuccess
           , error: this.onError
           }
         );
    }

    , onSuccess: function(model,resp){ this.el.find("input").val(""); }
    , onError: function(model, resp){ $("#messages").html(resp.responseText); }

  }
  );


  var WordListView = Backbone.View.extend({
    list: null

    ,words: new Words()

    ,initialize: function(){
      self=this;
      this.list = this.el.find("ul")
      this.bindModel();
      this.model.fetch({ success: function(){self.render();}});
    }

    , bindModel: function(){
      _.bindAll(this, "render", "appendWord", "prependWord");

      this.model.bind('add', this.prependWord);

    }

    ,refresh: function(){this.list.listview("refresh");}

    ,prependWord: function(word){
      wv = new WordView({model: word}).render().el;
      self.list.prepend( wv );
      self.refresh();
    }

    ,appendWord: function(word){
      wv = new WordView({model: word}).render().el;
      self.list.append( wv );
      self.refresh();
    }

    ,render: function(){
      self = this;
      self.list.html("");
      this.model.each(function(word){self.appendWord(word)});
      self.refresh();
    }


  }
  );


  // Attach the view to an element
  words = new Words({
    url: $("#word-list-view").data('url')
  }
  );
  new PlayView({model: words, el: $("#word-play-view"), leoView: this.leoView});
  new WordListView({model: words, el: $("#word-list-view")});
  new WordAddView({model: words, el: $("#word-add-view")});
  

});
