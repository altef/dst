define(["backbone", "jquery", "underscore", "textcomplete", "debounce"], function(backbone, $, _, tc, _debounce) {
	return Backbone.View.extend({
		el: $('#gather'),
		lookupmap: {},
		reverselookupmap: {},
		initialize: function(){
			var o = this;
			
			for(var i=0; i < window.data.items.length; i++) {
				this.lookupmap[window.data.items[i].name] = i;
				this.lookupmap[window.data.items[i].friendlyname.toLowerCase()] = i;
				this.reverselookupmap[window.data.items[i].friendlyname.toLowerCase()] = window.data.items[i].name;
				for(var prop in window.data.items[i].ingredients)
					this.reverselookupmap[window.data.items[i].ingredients[prop].name.toLowerCase()] = prop;

			}
			
			$.get( "templates/gather_module.html", function( data ) {
				o.template = _.template(data);
				o.render();
			});
			
		},

		events: {
			'keyup textarea': 'calculate',
			'click input': 'calculate',
			'change textarea': 'calculate'
		},
		
		calculate: debounce(function() {
			data = this.$el.find('textarea').val();
			lines = data.split(/[\n,]/);
			var recurse = this.$el.find('input[type=checkbox]').is(':checked');
			var errors = [];
			
			var re = /^(\d+)\s+(.+)$/i; 
			var m;
			var myitems = {};
			for(var i=0; i < lines.length; i++) {
				line = lines[i].trim();
				if (line.length == 0) continue;
				if ((m = re.exec(line)) !== null) {
					var count = parseInt(m[1]);
					var item = m[2].trim();
					if (!myitems.hasOwnProperty(item))
						myitems[item] = 0;
					myitems[item] += count;
				} else {
					errors.push("Hey that doesn't look right.. '" + line + "' should be a number and then a craftable.");
				}
			}
			
			var ingredients = {};
			var tech = {};
			for(var item in myitems) {
				if (!this.lookupmap.hasOwnProperty(item.toLowerCase())) {
					errors.push("I don't know what '" + item + "' is &ndash; it's not in my dataset.");
				} else {
					var data = this.getComponents(item, recurse);
					for(var r in data.tech)
						tech[r] = 1;
					for(var comp in data.ingredients) {
						if (!ingredients.hasOwnProperty(comp))
							ingredients[comp] = 0;
						ingredients[comp] += myitems[item] * data.ingredients[comp];
					}
				}
			}
			
			if (recurse) {
				for(var r in tech) {
					var data = this.getComponents(r, recurse);
					for(var comp in data.ingredients) {
						if (!ingredients.hasOwnProperty(comp))
							ingredients[comp] = 0;
						ingredients[comp] += data.ingredients[comp];
					}
				}
			}
			if (errors.length > 0) {
				var out = "";			
				for(var i=0; i < errors.length; i++) {
					out += "<p>" + errors[i] + "</p>\n";
				}
				this.$el.find('.errors').html(out);
			} else			
				this.$el.find('.errors').html('');

			
			var out = "";
			if (!recurse) {
				out += this.listObject(tech, "<i style=\"background-image: url(i/icons/{name}.png\" />1 <small>x</small> {key}");
			}
			out += this.listObject(ingredients, "<i style=\"background-image: url(i/icons/{name}.png\" />{value} <small>x</small> {key}");
			this.$el.find('.results').html(out);
		}, 500),
		
		listObject: function(o, format_string) {
			var k = Object.keys(o);
			k.sort();
			var out = "<ul>\n";
			for(var i=0; i < k.length; i++) {
				var name = this.reverselookupmap[k[i].toLowerCase()];
				var str = format_string.replace('{key}', k[i]).replace('{value}', o[k[i]]).replace('{name}', name);
				out += "<li>" + str + "</li>\n";
			}
			out += "</ul>\n";
			return out;
		},
		
		
		getComponents: function(item, recurse) {
			var o = {
				tech: {},
				ingredients: {}
			};
			var i = window.data.items[this.lookupmap[item.toLowerCase()]];
			if (i.tech.length > 0)
				if (this.lookupmap.hasOwnProperty(i.friendlytech.toLowerCase()))
					o['tech'][i.friendlytech] = 1;
				
			for(var ing in i.ingredients) {
				var c = i.ingredients[ing];
				if (recurse && this.lookupmap.hasOwnProperty(ing.toLowerCase())) {
					var d = this.getComponents(ing, recurse);
					for(var r in d.tech)
						o.tech[r] = 1;
					for(var comp in d.ingredients) {
						if (!o.ingredients.hasOwnProperty(comp))
							o.ingredients[comp] = 0;
						o.ingredients[comp] += d.ingredients[comp] * parseInt(c['amount']);
					}
						
				} else {
					if (!o.ingredients.hasOwnProperty(c[1]))
						o.ingredients[c['name']] = 0;
					o.ingredients[c['name']] += parseInt(c['amount']);
				}
			}
			return o;
		},

		help: function() {
			return {
				'title': 'Usage instructions',
				'content': this.$el.find('.help').html()
			}
		},
		
		render: function() {
			this.$el.html(this.template());
			var words = Object.keys(this.reverselookupmap);
			this.$el.find( "textarea" ).textcomplete([{
				match: /(^|\b)(\w{2,})$$/,
				search: function (term, callback) {
					term = term.toLowerCase();
					callback($.map(words, function (word) {
						return word.toLowerCase().indexOf(term) > -1 ? word : null;
					}));
				},
				replace: function (word) {
					return word + ' ';
				}
			}], {				
				appendTo: this.$el.find('form')
			});
			
			var focuslist = this.$el.find('*[data-focus=1]');
			if (focuslist.length > 0)
				focuslist[0].focus();
			return this;
		}
		
		
	
	});	
});