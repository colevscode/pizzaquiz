App = this.App || {};

App.Questions = Backbone.Collection.extend({
  url: "/backlift/data/questions"
});


App.FrameView = Backbone.View.extend({  
  events: {
    "submit form": "formSubmit"
  }
});


App.QuestionView = App.FrameView.extend({
  initialize: function() {
    App.FrameView.prototype.initialize.apply(this, arguments);
    this.template = Handlebars.templates.question;
  },

  render: function() {
    var data = this.model.toJSON();
    data['count'] = this.options.parent.currentFrame+1;
    var html = this.template(data);
    this.$el.html(html);
    return this;
  },

  formSubmit: function(ev) {
    ev.preventDefault();
    var val = $(ev.target).parent().find("input[type=radio]:checked").val();
    if (parseInt(val)+1 == parseInt(this.model.get("answer"))) {
      this.options.parent.correct();
    } else {
      this.options.parent.incorrect();
    }
  }

});


App.InfoView = App.FrameView.extend({
  initialize: function() {
    App.FrameView.prototype.initialize.apply(this, arguments);
    this.template = Handlebars.templates.message;
  },

  render: function() {
    this.$el.html(this.template(this.options.message));
    return this;
  },

  formSubmit: function(ev) {
    ev.preventDefault();
    this.options.next.call(this.options.parent);
    if (this.options.autoClean) {
      this.remove();
    }
  }  
});


App.QuestionsView = Backbone.View.extend({

  initialize: function() {
    
    this.welcomeFrame = new App.InfoView({
      message: {
        title: "Welcome to the Pizza Quiz!",
        text: "This is a test of your pizza knowledge. Let's see how well you do!",
        nextText: "start"
      },
      parent: this,
      next: this.advance
    });

    this.currentFrame = -1;

    this.render(this.welcomeFrame);

  },

  resetFrames: function() {
    // first remove existing frames
    if (this.qFrames) {
      _.each(this.qFrames, function(frame) {
        frame.remove();
      });
      this.qFrames.length = 0;
    }

    // now add all frames from collection
    var frames = new Array();
    this.collection.each(function(q) {
      var params = {
        model: q,
        parent: this
      };
      frames.push((new App.QuestionView(params)).render());
    }, this);
    this.qFrames = frames;    
  },

  render: function(frame) {
    frame = frame || this.qFrames[this.currentFrame];
    this.$el.html(frame.render().el);
    frame.delegateEvents();
  },

  advance: function() {
    this.currentFrame += 1;
    this.render();
  },

  correct: function() {
    App.stats.correct += 1;
    var next, nextText; 
    if (this.currentFrame+1 < this.collection.length) {
      next = this.advance;
      nextText = "next";
    } else {
      next = this.finish;
      nextText = "finish";
    }
    var successFrame = new App.InfoView({
      message: {
        title: "Correct!",
        text: "",
        nextText: nextText
      },
      parent: this,
      autoClean: true,
      next: next
    });
    this.render(successFrame);
  },

  incorrect: function() {
    App.stats.incorrect += 1;
    var failFrame = new App.InfoView({
      message: {
        title: "Incorrect!",
        text: "",
        nextText: "back"
      },
      parent: this,
      autoClean: true,
      next: this.render
    });
    this.render(failFrame);
  },

  finish: function() {
    var statsFrame = new App.InfoView({
      message: {
        title: "You're done!",
        text: "You got a total of "+App.stats.correct+" answers correct, and "+App.stats.incorrect+" incorrect.",
        nextText: ""
      },
      parent: this,
      autoClean: true,
    });
    this.render(statsFrame);
  }

});