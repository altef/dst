define(["jquery"], function($) {
	return function(map) {
		var _map = map;
		$('#page .module').hide();
		var o = {
			map: map,
			switchTo: function(key) {
				$('nav a').removeClass('active');
				$('nav a.' + key).addClass('active');
				if (this.map.hasOwnProperty(key)) {
					$('#page .module').hide();
					$('body').addClass('loading');
					this.map[key].$el.show();
					$('body').removeClass('loading');
					var focuslist = this.map[key].$el.find('*[data-focus=1]');
					if (focuslist.length > 0)
						focuslist[0].focus();
					 
				} else {
					console.log("Invalid key: " + key);
				}
			},
			current: function() {
				var classes = $('nav a.active')[0].className.split(/\s+/);
				for(var i=0; i < classes.length; i++) {
					if (map.hasOwnProperty(classes[i]))
						return map[classes[i]];
				}
			}
		}
		return o;
		
		
	}
	
});