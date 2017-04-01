define(["backbone", "jquery", "underscore", "textcomplete"], function(backbone, $, _, tc) {
	return Backbone.View.extend({
		el: $('#gather'),
		initialize: function(){
			var o = this;
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
		
		calculate: function() {
			data = this.$el.find('textarea').val();
			lines = data.split('\n');
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
					errors.push("Invalid item syntax '" + line + "' on line " + (i+1));
				}
			}
			
			var components = {};
			var requires = {};
			for(var item in myitems) {
				if (!window.data.items.hasOwnProperty(item)) {
					errors.push("Item not found: " + item);
				} else {
					var data = this.getComponents(item, recurse);
					for(var r in data.requires)
						requires[r] = 1;
					for(var comp in data.components) {
						if (!components.hasOwnProperty(comp))
							components[comp] = 0;
						components[comp] += myitems[item] * data.components[comp];					
					}
				}
			}
			
			if (recurse) {
				for(var r in requires) {
					var data = this.getComponents(r, recurse);
					for(var comp in data.components) {
						if (!components.hasOwnProperty(comp))
							components[comp] = 0;
						components[comp] += data.components[comp];					
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
				out += this.listObject(requires, "1 <small>x</small> {key}");
			}
			out += this.listObject(components, "{value} <small>x</small> {key}");
			this.$el.find('.results').html(out);
		},
		
		listObject: function(o, format_string) {
			var k = Object.keys(o);
			k.sort();
			var out = "<ul>\n";
			for(var i=0; i < k.length; i++) {
				var str = format_string.replace('{key}', k[i]).replace('{value}', o[k[i]]);
				out += "<li>" + str + "</li>\n";
			}
			out += "</ul>\n";
			return out;
		},
		
		
		getComponents: function(item, recurse) {
			var o = {
				requires: {},
				components: {}
			};
			var i = window.data.items[item];
			if (i.requires.length > 0)
				o['requires'][i.requires] = 1;
			
			for(var t = 0; t < i.components.length; t++) {
				var c = i.components[t];
				if (recurse && window.data.items.hasOwnProperty(c[1])) {
					var d = this.getComponents(c[1], recurse);
					for(var r in d.requires)
						o.requires[r] = 1;
					for(var comp in d.components) {
						if (!o.components.hasOwnProperty(comp))
							o.components[comp] = 0;
						o.components[comp] += d.components[comp] * parseInt(c[0]);					
					}
						
				} else {
					if (!o.components.hasOwnProperty(c[1]))
						o.components[c[1]] = 0;
					o.components[c[1]] += parseInt(c[0]);
				}
			}
			return o;
		},

		
		render: function() {
			this.$el.html(this.template());
			this.$el.find( "textarea" ).textcomplete([{
				match: /(^|\b)(\w{2,})$$/,
				search: function (term, callback) {
					var words = Object.keys(window.data.items);
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