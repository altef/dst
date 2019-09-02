requirejs(["backbone", "views/create", "views/gather", "views/recipes", "module_manager", "Logipar"], function(backbone, CreateView, GatherView, RecipesView, ModuleManager, logipar) {
	var loader = 0;
	window.data = {};
	
	
	
	function renametech(name) {
		map = {
			'NONE': '',
			'SCIENCE_ONE': 'science machine',
			'SCIENCE_TWO': 'alchemy engine',
			'LOST': 'blueprint',
			'MAGIC_TWO': 'prestihatitator',
			'MAGIC_THREE': 'shadow manipulator',
			'SCULPTING_ONE': 'potter\'s wheel',
			'SHADOW_TWO': 'maxwell',
			'CARTOGRAPHY_TWO': 'cartographer\'s desk',
			'ANCIENT_TWO': 'broken ancient pseudoscience station',
			'ANCIENT_FOUR': 'ancient pseudoscience station',
			'ORPHANAGE_ONE': 'rock den',
			'PERDOFFERING_ONE': 'gobbler shrine',
			'PERDOFFERING_THREE': 'gobbler shrine',
			'WARGOFFERING_THREE': 'varg shrine',
			'YOTG': 'year of the gobbler',
			'YOTV': 'year of the varg',
			'WINTERS_FEAST': 'winter\'s feast',
			'HALLOWED_NIGHTS': 'hallowed nights',
			'SCIENCE_THREE': 'wickerbottom',
			'MADSCIENCE_ONE': 'mad scientist lab',
			'PIGOFFERING_THREE': 'pig shrine',
			'FOODPROCESSING_ONE': 'portable seasoning station',
			'MOON_ALTAR_TWO': 'celestial altar',
			'SEAFARING_TWO': 'think tank',
			'CELESTIAL_ONE': 'celestial orb'
		}
		
		if (map.hasOwnProperty(name))
			return map[name];
		return name;
	}
	
	
	$.getJSON( "json/recipes.json", function( data ) {
		// Clean up the data
		window.data.items = [];
		for(var i=0; i < data.length; i++) {
			if (data[i]['tab'] == null)
				continue;
			data[i].friendlytech = renametech(data[i].tech);
			window.data.items.push(data[i]);
		}
		
		if (++loader == 2) ready();
	});
	$.getJSON( "json/food.json", function( data ) {
		window.data.food = [];
		for(var prop in data) {
			var d = data[prop];
			if (!d.hasOwnProperty('foodtype'))
				d['foodtype'] = '';
			d['friendlyfoodtype'] = d['foodtype'].replace(/FOODTYPE\./g, '');
			d['friendlytest'] = d['test'].replace(/(names|tags)\./g, '');
			var lp = new Logipar();
			lp.caseSensitive = false;
			try {
				lp.parse(d['friendlytest']);
				d['friendlytest'] = lp.stringify(function(n) {
					if (n.token.type == Token.LITERAL) {
						return "<strong>" + n.token.literal + "</strong>";
					}
				});
			} catch(e) {
				console.log(e);
				console.log(d['friendlytest']);
			}
			window.data.food.push(d);
		}
		if (++loader == 2) ready();
	});


	window.slug = function(str) {
		return str.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase();
	}

	function ready() {
		for(var cat in window.data.cats) {
			var o = {};
			for(var i=0; i < window.data.cats[cat].length; i++) {
				o[window.data.cats[cat][i]] = window.data.items[window.data.cats[cat][i]];
			}
			window.data.cats[cat] = o;
		}

		var modules = new ModuleManager({
			'create': new CreateView(),
			'gather': new GatherView(),
			'recipes': new RecipesView()
		});
		
		var AppRouter = Backbone.Router.extend({
			routes: {
				"create/*filter": "createRoute",
				"gather/*data": "gatherRoute",
				"recipes": "recipesRoute",
				"*filter": "createRoute"
			}
		});
		
		var app_router = new AppRouter;
		
		var createRoute = function(filter) {
			modules.switchTo('create');
		}

		
		app_router.on('route:createRoute', createRoute);


		app_router.on('route:gatherRoute', function(data) {
			modules.switchTo('gather');
		});

		app_router.on('route:recipesRoute', function() {
			modules.switchTo('recipes');
		});


		// Start Backbone history a necessary step for bookmarkable URL's
		Backbone.history.start();
		
		// Help overlay
		$('a.help').on('click', function(e) {
			e.preventDefault();
			m = modules.current();
			var helpdata = m.help();
			$('.helpmodal .title span').text(helpdata['title']);
			$('.helpmodal .content').html(helpdata['content']);
			$('.helpoverlay').addClass('open');
		});

		$('.helpmodal').on('click', function(e) { e.stopPropagation(); });
		$('.helpoverlay, .helpmodal .title a').on('click', function(e) {
			e.preventDefault();
			$('.helpoverlay').removeClass('open');
		});
		
		$(document).keyup(function(e) {
			 if (e.key === "Escape") { // escape key maps to keycode `27`
				$('.helpoverlay.open').removeClass('open');
			}
		});

	}		
});