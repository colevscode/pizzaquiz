App = this.App || {};

$(function() {
  App.questions = new App.Questions();
  App.stats = { correct: 0, incorrect: 0 };

  App.questionsView = new App.QuestionsView({
    el: ".questions",
    collection: App.questions
  });

  App.questions.fetch({success: function() {
    App.questionsView.resetFrames();
  }});

});