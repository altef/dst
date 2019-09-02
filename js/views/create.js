define(["backbone", "jquery", "underscore", "Logipar", "debounce"], function(backbone, $, _, logipar, _debounce) {
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
		
		

		matches: function(row, value) {
			value = value.trim()
			if (value.length == 0)
				return true;
			
			var checkIngredients = function(ingredients, field, operator = null, operand = null) {
			// Use both key and name
				field = field.trim()
				for(var prop in ingredients) {
					p = prop.toLowerCase();
					n = ingredients[prop]['name'].toLowerCase();
					v = parseFloat(ingredients[prop]['amount']);
					switch(operator) {
						case '>':
							if ((p.includes(field) || n.includes(field)) && v > operand)
								return true;
							break;
						case '<':
							if ((p.includes(field) || n.includes(field)) && v < operand)
								return true;
							break;
						case '=': 
							if ((p.includes(field) || n.includes(field)) && v == operand)
								return true;
							break;
						default: // contains
							if (p.includes(field) || n.includes(field))
								return true;

					}
				}
				return false;
			};


			var checkField = function(row, field, operator, operand) {
				// use both friendlyname and non friendly name when applicable
				field = field.trim()
				
				switch(operator) {
					case '=': 
						if ((row.hasOwnProperty(field) && row[field].toLowerCase() == operand) || (row.hasOwnProperty('friendly' + field) && row['friendly' + field].toLowerCase() == operand))
							return true;
						break;
					default: // contains
						if ((row.hasOwnProperty(field) && row[field].toLowerCase().includes(operand)) || (row.hasOwnProperty('friendly' + field) && row['friendly' + field].toLowerCase().includes(operand)))
							return true;
				}
				return false;
			};

			
			
			
			var m = /^((requires|uses)\s+)?(greater|more)\s+than\s+(\d+)\s+(.*)$/.exec(value);
			if (m != null) {
				// check ingredients for >
				return checkIngredients(row['ingredients'], m[m.length - 1], '>', parseFloat(m[m.length - 2]))
			}
			
			m = /^((requires|uses)\s+)?(less|fewer)\s+than\s+(\d+)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check ingredients for <
				return checkIngredients(row['ingredients'], m[m.length - 1], '<', parseFloat(m[m.length - 2]))
			}
			
			m = /^(requires|uses)\s+(\d+)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check ingredients for =
				return checkIngredients(row['ingredients'], m[m.length - 1], '=', parseFloat(m[m.length - 2]))
			}
			
			m = /^(requires|uses)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check ingredients for contains
				return checkIngredients(row['ingredients'], m[m.length - 1].trim()) || checkField(row, 'tech', null, m[m.length - 1].trim());
			}
			
			m = /^(.*)\s+(contains)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check a certain field for contains
				return checkField(row, m[1], null, m[3].trim());
			}
			
			m = /^(.*)\s+(is|equals)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check a certain field for =
				return checkField(row, m[1], '=', m[3].trim());
			}
			
			m = /^(contains)\s+(.*)$/.exec(value);
			if (m != null)
				value = m[2].trim()
			
			// Otherwise, check all fields for contains
			var result = false
			for(var prop in row) {
				if (prop == 'ingredients') {
					// Check if name or sub prob contains
					for(var p in row[prop]) {
						result |= p.toLowerCase().includes(value);
						result |= row[prop][p]['name'].includes(value);
					}
				} if (typeof yourVariable !== 'object') {
					result |= ("" + row[prop]).toLowerCase().includes(value);
				}
			}
			
			return result;
		},
		
		help: function() {
			return {
				'title': 'Usage instructions',
				'content': this.$el.find('.help').html()
			}
		},

		filterResults: debounce(function(filter) {

			this.$el.find('.results').html('');
			
			var lp = new Logipar();
			lp.caseSensitive = false;
			try {
				lp.parse(filter.replace(/,/g, ' OR ').toLowerCase()); // Commas are ORs
				
				var f = lp.filterFunction(this.matches);
				//f(window.data.items[0]);
				var data = window.data.items.filter(f)
				data.sort(function(a,b) { return a['friendlyname'] > b['friendlyname'] ? 1 : -1; });
				for(var i=0; i < data.length; i++) {
						try {
							this.$el.find('.results').append(this.item_template(data[i]));
						} catch (e) {
							console.log("exception templating", data[i]);
							console.log(e);
						}
				}
			} catch (e) {
				this.$el.find('.results').append("<p style=\"margin-left: 20px; margin-top: 20px;\">I didn't find any results matching the filter \"<strong>"+filter+"</strong>\".</p>");
			}
		}, 500),
	});	
});