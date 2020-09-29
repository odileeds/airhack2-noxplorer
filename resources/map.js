(function(root){
	
	function NOXplorer(opts){

		console.info('NOXplorer',opts);

		// If no options provided we'll create an empty placeholder
		if(!opts) opts = {};
		this.key = "Total_NOx_18";
		this.opts = opts;
		
			
		// Define some basemap tile options
		if(opts.baseMaps) this.baseMaps = opts.baseMaps;
		else this.baseMaps = {};
		
		this.baseMaps['Greyscale'] = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
			attribution: 'Tiles: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});

		// Define our Leaflet map attached to <div id="map-holder">
		this.map = L.map('map-holder',{
			'layers':[this.baseMaps['Greyscale']],
			'scrollWheelZoom':true,
			'center': (opts.center||[53.8324,-1.7539]),
			'zoom': (opts.zoom||10)
		});
		
		// Set event listener
		var el = document.getElementById('layers');
		// Set the value to match the select drop-down
		if(el.value) this.key = el.value;

		var _obj = this;
		el.addEventListener('change', function(e){
			_obj.setKey(e.currentTarget.value);
		});
		
		// Now get the data
		this.getData((opts.url || "data/30-nox-2018.csv"));

	}
	
	NOXplorer.prototype.getData = function(url){

		console.info('getData',url);

		fetch(url,{'method':'GET'}).then(response => {

			headers = response.headers;
			if(!response.ok) throw new Error('Request Failed'); 
			return response.text();

		}).then(text => {

			var i,line,j,latlon,e,n,colname;
			this.lookup = {};
			this.grid = [];
			this.data = [];
			this.range = {};
			
			// Split the text by newline characters into an array of lines
			this.data = text.split(/[\n\r]/);

			// Loop over the lines
			for(i = 0; i < this.data.length; i++){
				
				// Split the line by commas (because we know this is a simple CSV)
				this.data[i] = this.data[i].split(/\,/);
				
				// If it is the header row we'll make a map of header column name to column number
				if(i == 0){
					// Loop over the columns
					for(j = 0; j < this.data[i].length; j++) this.lookup[this.data[i][j]] = j;

				}else{

					// Calculate the ranges
					for(j = 0; j < this.data[i].length; j++){
						colname = this.data[0][j];
						// If this seems to be a number we convert it properly into one
						if(typeof parseFloat(this.data[i][j])=="number"){
							this.data[i][j] = parseFloat(this.data[i][j]);
						}

						if(!this.range[colname]) this.range[colname] = {'min':1e100,'max':-1e100};
						this.range[colname].min = Math.min(this.range[colname].min,this.data[i][j]);
						this.range[colname].max = Math.max(this.range[colname].max,this.data[i][j]);
					}

				}

			}

			// Remove the header line
			header = this.data.shift();

			for(i = 0; i < this.data.length; i++){
				
				e = this.data[i][this.lookup['x']];
				n = this.data[i][this.lookup['y']];

				if(!isNaN(e) && !isNaN(n)){
					latlon = NEtoLL([ e, n ]);
					
					// Create a circle marker
					this.grid.push(L.circle(latlon, {
						weight: 0,
						fillColor: '#f03',
						fillOpacity: 1,
						radius: 500
					}));

					// Add the new circle to the map
					this.grid[this.grid.length-1].addTo(this.map);
				}
			}

			// Now set the key to use for opacity and update
			this.setKey(this.key);

		}).catch(error => {

			console.error('Failed to load '+url);

		});
		return this;
	}
	
	
	NOXplorer.prototype.setKey = function(key){
		
		console.info('setKey',key);

		this.key = key;
		
		var i,e,n,op;

		for(i = 0; i < this.grid.length; i++){
						
			op = (this.data[i][this.lookup[key]] - this.range[key].min)/(this.range[key].max - this.range[key].min);
			
			this.grid[i].setStyle({'fillOpacity': op});

		}
		
		return this;
	}

	// Convert Northings and Eastings to Latitude and Longitude using geotools2.js library
	function NEtoLL(coo){

		var osgb = new GT_OSGB();
		osgb.setGridCoordinates(coo[0],coo[1]);
		var wgs84 = osgb.getWGS84();
		return [wgs84.latitude,wgs84.longitude];
		
	}

	root.NOXplorer = NOXplorer;

})(window || this);

// Define a function to check if the page is ready
function ready(f){
	// If the page isn't ready it calls itself every 9 milliseconds
	// Otherwise it calls the function we passed into it
	if(/in/.test(document.readyState)) setTimeout('ready('+f+')',9);
	else f();
};


	
// Check if the page is ready
ready(function(){


	var app = new NOXplorer({});


});
