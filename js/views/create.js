define(["backbone", "jquery", "underscore"], function(backbone, $, _) {
	return Backbone.View.extend({
		el: $('#create'),

		initialize: function(){
			var o = this;
			$.get( "templates/create_module.html", function( data ) {
				o.template = _.template(data);
				$.get( "templates/item.html", function( data ) {
					o.item_template = _.template(data);
					o.render();
				});
			});
		},

		events: {
			'keyup input': 'filterMe'
		},
		
		render: function() {
			this.$el.html(this.template());
			this.filterResults('');
			var focuslist = this.$el.find('*[data-focus=1]');
			if (focuslist.length > 0)
				focuslist[0].focus();
			return this;
		},

		filterMe: function() {
			this.filterResults(this.$el.find('input').val());
		},
		
		filterResults: function(filter) {
			this.$el.find('.results').html('');
			var chunks = filter.toLowerCase().split(",").map(function(a) { return a.trim(); });
			var fcats = {};
			for(var cat in window.data.cats) {
				fcats[cat] = {};
				if (this.match(cat.toLowerCase(), chunks)) {
					fcats[cat] = window.data.cats[cat];
				} else {
					for(var item in window.data.cats[cat]) {
						if (this.match(item.toLowerCase(), chunks)) {
							fcats[cat][item] = window.data.cats[cat][item];
						} else {
							for(var i=0; i < window.data.cats[cat][item].components.length; i++) {
								if (this.match(window.data.cats[cat][item].components[i][1].toLowerCase(), chunks)) {
									fcats[cat][item] = window.data.cats[cat][item];
									break;
								}
							}
						}
					}
				}
			}
			
			for(var cat in fcats) {
				if (Object.keys(fcats[cat]).length === 0) continue;
				for(var item_name in fcats[cat]) {
					var item = _.extend({name: item_name, category: cat}, fcats[cat][item_name]);
					this.$el.find('.results').append(this.item_template(item));
					
				}
			}
		},
		
		match: function(str, chunks) {
			for(var i=0; i < chunks.length; i++) {
				if (str.indexOf(chunks[i]) > -1)
					return true;
			}
			return false;
		}

		
	
	});	
});