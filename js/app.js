requirejs(["backbone", "views/create", "views/gather", "views/recipes", "module_manager"], function(backbone, CreateView, GatherView, RecipesView, ModuleManager) {
	var loader = 0;
	window.data = {};
	
	$.getJSON( "json/items.json", function( data ) {
		window.data.items = data;
		if (++loader == 2) ready();
	});
	$.getJSON( "json/categories.json", function( data ) {
		window.data.cats = data;
		if (++loader == 2) ready();
	});


	window.slug = function(str) {
		return str.replace(' ', '-').toLowerCase();
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
	}		
});