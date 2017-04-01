define(["backbone", "jquery", "underscore"], function(backbone, $, _) {
	return Backbone.View.extend({
		el: $('#recipes'),
		initialize: function(){
			var o = this;
			$.get( "templates/recipes_module.html", function( data ) {
				o.template = _.template(data);
				o.render();
			});
		},
		
		render: function() {
			this.$el.html(this.template());
			var focuslist = this.$el.find('*[data-focus=1]');
			if (focuslist.length > 0)
				focuslist[0].focus();
			return this;
		}
	});
});