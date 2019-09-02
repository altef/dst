define(["backbone", "jquery", "underscore", "debounce"], function(backbone, $, _, _debounce) {
	return Backbone.View.extend({
		el: $('#recipes'),
		initialize: function(){
			var o = this;
			$.get( "templates/recipes_module.html", function( data ) {
				o.template = _.template(data);
				$.get( "templates/food.html", function( data ) {
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
			
			var checkNumeric = function(row, field, operator = null, operand = null) {
			// Use both key and name
				var numeric = ['sanity', 'health', 'hunger', 'perishtime', 'cooktime', 'temperature', 'temperatureduration', 'priority'];
				field = field.trim()
				if (!row.hasOwnProperty(field)) return false; // Only deal with fields that exist
				if (!numeric.includes(field)) return false; // Only deal with numeric fields
				
				v = parseFloat(row[field]);
				switch(operator) {
					case '>':
						return v > operand;
					case '<':
						return v < operand;
					case '=': 
						return v == operand;
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

			
			
			
			var m = /^(greater|more)\s+than\s+(\d+)\s+(.*)$/.exec(value);
			if (m != null) {
				// check numeric for >
				return checkNumeric(row, m[m.length - 1], '>', parseFloat(m[m.length - 2]))
			}
			
			m = /^(less|fewer)\s+than\s+(\d+)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check numeric for <
				return checkNumeric(row, m[m.length - 1], '<', parseFloat(m[m.length - 2]))
			}
			
			m = /^(\d+)\s+(.*)$/.exec(value);
			if (m != null) {
				// Check numeric for =
				return checkNumeric(row, m[m.length - 1], '=', parseFloat(m[m.length - 2]))
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
				var data = window.data.food.filter(f)
				data.sort(function(a,b) { return a['friendlyname'] > b['friendlyname'] ? 1 : -1; });
				for(var i=0; i < data.length; i++) {
						try {
							data[i]['tagsummary'] = data[i].hasOwnProperty('tags') && data[i]['tags'].length > 0 ? "<dd>Tags: " + data[i]['tags'].join(", ") + "</dd>" : "";
							data[i]['tempsummary'] = data[i].hasOwnProperty('temperature') > 0 ? "<dd>Temperature: " + data[i]['temperature'] + " for " + data[i]['temperatureduration'] + "</dd>" : "";
							data[i]['amountsummary'] = data[i].hasOwnProperty('stacksize') > 0 ? "<dd>Amount: " + data[i]['stacksize'] + "</dd>" : "";
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