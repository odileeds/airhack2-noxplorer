(function(root){
	
	function NOXplorer(opts){

		console.info('NOXplorer',opts);
		
		var el,_obj;

		// If no options provided we'll create an empty placeholder
		if(!opts) opts = {};
		this.key = "Total_NOx_18";
		this.scale = "Plasma";
		this.opts = opts;
		this.events = {};
		this.colour = new Colours();
		this.colour.addScale('Red','rgb(255,255,255) 0%, rgb(214,3,3) 100%');
		this.colour.addScale('Black','rgb(255,255,255) 0%, rgb(0,0,0) 100%');
		// Reverse the colour order of existing scales
		this.colour.addScale('Heat','rgb(255,255,255) 0%, rgb(255,255,128) 25%, rgb(255,128,0) 50%, rgb(128,0,0) 75%, rgb(0,0,0) 100%');
		this.colour.addScale('Viridis','rgb(253,231,36) 0%, rgb(186,222,39) 10%, rgb(121,209,81) 20%, rgb(66,190,113) 30%, rgb(34,167,132) 40%, rgb(32,143,140) 50%, rgb(41,120,142) 60%, rgb(52,94,141) 70%, rgb(64,67,135) 80%, rgb(72,35,116) 90%, rgb(68,1,84) 100%');
		this.colour.addScale('ODI','rgb(249,188,38) 0%, rgb(230,0,124) 50%, rgb(114,46,165) 100%');
		this.colour.addScale('Plasma','rgb(239,248,33) 0%, rgb(252,204,37) 10%, rgb(252,166,53) 20%, rgb(241,130,76) 30%, rgb(224,100,97) 40%, rgb(202,70,120) 50%, rgb(176,42,143) 60%, rgb(143,13,163) 70%, rgb(106,0,167) 80%, rgb(64,3,156) 90%, rgb(12,7,134) 100%');
		this.colour.addScale('Leodis','#ffffff 0%, #F9BC26 50%, #2254F4 100%');
		this.colour.addScale('Longside','#addde6 0%, #801638 100%');

		_obj = this;
		

		// Define some basemap tile options
		if(opts.baseMaps) this.baseMaps = opts.baseMaps;
		else this.baseMaps = {};
		
		this.baseMaps['greyscale'] = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
			attribution: 'Tiles: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});
		this.baseMaps['cartodb'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});
		this.baseMaps['cartodb-greyscale'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});
		this.baseMaps['cartodb-dark'] = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png', {
			attribution: 'Tiles: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
			maxZoom: 19
		});
		this.baseMaps['esri'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
		});

		// Define our Leaflet map attached to <div id="map-holder">
		this.map = L.map('map-holder',{
			'layers':[this.baseMaps['cartodb-greyscale']],
			'scrollWheelZoom':true,
			'center': (opts.center||[53.8324,-1.7539]),
			'zoom': (opts.zoom||10)
		});


		// Add info control
		this.info = L.control({'position':'topright'});
		this.info.onAdd = function(map){
			this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
			this._div.innerHTML = "Info";
			return this._div;
		};
		this.info.addTo(this.map);

		// Add scalebar control
		this.scalebar = L.control({'position':'topright'});
		this.scalebar.onAdd = function(map){
			this._div = L.DomUtil.create('div', 'scalebar'); // create a div with a class "info"
			this.update();
			return this._div;
		};
		// method that we will use to update the control based on feature properties passed
		this.scalebar.update = function(props){
			this._div.innerHTML = '<div class="bar" style="background:linear-gradient(to right,'+_obj.colour.getColourScale(_obj.scale)+');"></div><div class="range"><span class="min">'+(_obj.range ? _obj.range[_obj.key].min.toFixed(3) : '')+'</span><span class="max">'+(_obj.range ? _obj.range[_obj.key].max.toFixed(3) : '')+'</span></div>';
		};
		this.scalebar.addTo(this.map);

		// Make postcode search
		this.typeahead = TypeAhead.init('#typeahead',{
			'max': 8,
			'items': [],
			'render': function(d){
				// Render the drop down list item for each airport.
				// This can be HTML. It will be wrapped in <a>
				return d.Postcode;
			},
			'rank': function(d,str){
				// Calculate a weighting
				var r = 0;
				var p1 = d.Postcode.replace(/ /g,"");
				var p2 = str.replace(/ /g,"");
				// If the name starts with the string add 3
				if(p1.toUpperCase().indexOf(p2.toUpperCase())==0) r += 3;
				if(d.Postcode.toUpperCase().indexOf(str.toUpperCase())==0) r += 3;
				return r;
			},
			'process': function(d){
				this.el.value = d.Postcode;
				_obj.map.panTo(L.latLng(d.Lat, d.Lon));
				_obj.map.setZoom(14);
			}
		});
		this.typeahead.files = {};
		// Attach a callback to the 'change' event. This gets called each time the user enters/deletes a character.
		this.typeahead.on('change',{'this':this.typeahead},function(e){
			
			var f = this.el.value.replace(/^([A-Z]{1,2}[0-9]+)\s?.*$/,function(m,p1){ return p1; });
			f = f.toUpperCase().replace(/\s.*/g,"");

			if(f.length >=3 && !this.files[f]){
				this.files[f] = [];
				console.info('Getting '+f+'.csv');
				fetch("postcodes/"+f+".csv",{'method':'GET'}).then(response => {

					if(!response.ok) throw new Error('Request Failed'); 
					return response.text();

				}).then(d => {

					d = d.split(/[\n\r]+/);
					data = new Array(d.length-1);
					this.files[f] = data;
					for(var l = 0; l < d.length; l++){
						cols = d[l].split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/);
						if(l == 0) header = cols;
						else{
							datum = {};
							for(var c = 0; c < cols.length; c++) datum[header[c]] = cols[c].replace(/(^\"|\"$)/g,"");
							data[l-1] = datum;
						}
					}
					this.addItems(data);

					// Trigger keyup event
					var event = document.createEvent('HTMLEvents');
					event.initEvent('keyup', true, false);
					this.el.dispatchEvent(event);

				}).catch(error => {

					console.error('Failed to load '+f);

				});
			}
		});


		// Set event listeners
		el = document.getElementById('layers');
		// Set the value to match the select drop-down
		if(el.value) this.key = el.value;
		el.addEventListener('change', function(e){
			_obj.setKey(e.currentTarget.value);
		});
		datakeys = el.querySelectorAll('option');
		this.keys = {};//new Array(datakeys.length);
		for(i = 0; i < datakeys.length; i++) this.keys[datakeys[i].getAttribute('value')] = {'label':datakeys[i].innerHTML};
		el = document.getElementById('colours');
		// Set the value to match the select drop-down
		if(el.value) this.scale = el.value;
		el.addEventListener('change', function(e){
			_obj.setColourScale(e.currentTarget.value);
		});
		el = document.getElementById('interpolation');
		// Set the value to match the select drop-down
		if(el.value) this.interpolation = el.value;
		el.addEventListener('change', function(e){
			_obj.setInterpolation(e.currentTarget.value);
		});
		
		this.on('move',function(e){
			this.updateCrosshair(this.map.getCenter());
		});
		this.on('moveend',function(e){
			this.updateCrosshair(this.map.getCenter());
			this.calculate();
		});
		this.on('zoom',function(e){
			this.updateCrosshair(this.map.getCenter());
		});
		this.on('zoomend',function(e){
			this.updateCrosshair(this.map.getCenter());
		});
		
		
		this.map.on("move", function(){ _obj.trigger('move'); });
		this.map.on("moveend", function(){ _obj.trigger('moveend'); });
		this.map.on("zoom", function(){ _obj.trigger('zoom'); });
		this.map.on("zoomend", function(){ _obj.trigger('zoomend'); });
		
		// Now get the data
		this.getData((opts.url || "data/30-nox-2018.csv"));

	}


	// Attach a handler to an event for the OSMEditor object in a style similar to that used by jQuery
	//   .on(eventType[,eventData],handler(eventObject));
	//   .on("authenticate",function(e){ console.log(e); });
	//   .on("authenticate",{me:this},function(e){ console.log(e.data.me); });
	NOXplorer.prototype.on = function(ev,e,fn){
		if(typeof ev!="string") return this;
		if(typeof fn==="undefined"){
			fn = e;
			e = {};
		}else{
			e = {data:e}
		}
		if(typeof e!="object" || typeof fn!="function") return this;
		if(this.events[ev]) this.events[ev].push({e:e,fn:fn});
		else this.events[ev] = [{e:e,fn:fn}];
		return this;
	}

	// Trigger a defined event with arguments. This is for internal-use to be 
	// sure to include the correct arguments for a particular event
	NOXplorer.prototype.trigger = function(ev,args){
		if(typeof ev != "string") return;
		if(typeof args != "object") args = {};
		var o = [];
		if(typeof this.events[ev]=="object"){
			for(var i = 0 ; i < this.events[ev].length ; i++){
				var e = extendObject(this.events[ev][i].e,args);
				if(typeof this.events[ev][i].fn == "function") o.push(this.events[ev][i].fn.call(e['this']||this,e))
			}
		}
		if(o.length > 0) return o;
	}
		
	NOXplorer.prototype.updateCrosshair = function(centre){
		if(!centre) centre = this.map.getCenter();
		var crosshairIcon = L.icon({'iconUrl': 'resources/crosshair.svg','iconSize': [32, 32], 'iconAnchor': [10, 10] });
		if(!this.point){
			this.point = new L.marker(centre,{icon: crosshairIcon, clickable:false});
			this.point.addTo(this.map);
		}else{
			this.point.setLatLng(centre);
		}
		return this;
	}
	
	NOXplorer.prototype.calculate = function(point,method){
		var i,d,near,w,values,k,j,el,keys,table;
		if(!point) point = this.map.getCenter();
		if(!method) method = this.interpolation;
		d = [];
		w = [1];
		el = document.getElementById('output');
		// Find the distance (in metres) to each grid point
		for(i = 0; i < this.grid.length; i++) d[i] = this.grid[i].getBounds().getCenter().distanceTo(point);
		// Get the indices of the nearest points
		near = sortIndices(d);
		
		if(d[near[0]] > 1000){
			el.innerHTML = "Too far away from data!";
			document.querySelector('.info').innerHTML = "";
			return this;
		}

		if(method == "mean"){
			w = [1,1,1,1];
		}else if(method == "gaussian"){
			w = [1,1,1,1,1,1,1,1];
			for(i = 0; i < w.length; i++){
				w[i] = Math.exp(-Math.pow(d[near[i]],2)/(2*Math.pow(500,2)));
			}
		}

		values = {};
		for(k in this.keys){
			if(!values[k]) values[k] = {'v':0,'t':0};
			for(i = 0; i < w.length; i++){
				values[k].v += w[i] * this.data[near[i]][this.lookup[k]];
				values[k].t += w[i];
			}
			values[k].v /= values[k].t;
		}

		keys = [];
		k = this.key;
		// Get colour
		col = new Colour(this.colour.getColourFromScale(this.scale,values[this.key].v,this.range[this.key].min,this.range[this.key].max));
		document.querySelector('.info').innerHTML = ''+this.keys[k].label+' at <span class="coords">'+point.lat.toFixed(5)+','+point.lng.toFixed(5)+'</span>: <span style="background-color:'+col.hex+';color:'+col.text+'" class="value">'+values[this.key].v.toFixed(3)+'</span>';
		rows = [['Total NOx','','','Total_NOx_18'],['Motorway','Motorway_in_18','Motorway_out_18',''],['Trunk road','Trunk_A_Rd_in_18','Trunk_A_Rd_out_18',''],['Primary A-road','Primary_A_Rd_in_18','Primary_A_Rd_out_18',''],['Minor Road Cold Start','Minor_Rd+Cold_Start_in_18','Minor_Rd+Cold_Start_out_18',''],['Industry','Industry_in_18','Industry_out_18',''],['Domestic','Domestic_in_18','Domestic_out_18',''],['Aircraft','Aircraft_in_18','Aircraft_out_18',''],['Rail','Rail_in_18','Rail_out_18',''],['Other','Other_in_18','Other_out_18',''],['Point sources','','','Point_Sources_18'],['Rural','','','Rural_18']];

		table = '<p>A summary of all the NOx contributions:</p>';
		table += '<table>';
		table += '<tr><td>Layer</td><td>Near</td><td>Remote</td><td>Total</td>';
		for(r = 0; r < rows.length; r++){
			table += '<tr>';
			for(c = 0; c < rows[r].length; c++){
				k = rows[r][c];
				if(typeof k==="string"){
					if(k && this.lookup[k]){
						col = new Colour(this.colour.getColourFromScale(this.scale,values[k].v,this.range[k].min,this.range[k].max));
						table += '<td style="background-color:'+col.hex+';color:'+col.text+'"><span class="value">'+(k && this.lookup[k] ? values[k].v.toFixed(3) : '')+'</span></td>'
					}else{
						table += '<td>'+k+'</td>'					
					}
				}else table += '<td></td>'
			}
			table += '</tr>';
		}
		table += '</table>';
		
		el.innerHTML = table;

		return this;
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
			
			this.range.lat = {'min':90,'max':-90};
			this.range.lon = {'min':180,'max':-180};

			for(i = 0; i < this.data.length; i++){
				
				e = this.data[i][this.lookup['x']];
				n = this.data[i][this.lookup['y']];

				if(!isNaN(e) && !isNaN(n)){
					latlon = NEtoLL([ e, n ]);
					
					this.range.lat.min = Math.min(this.range.lat.min,latlon[0]);
					this.range.lat.max = Math.max(this.range.lat.max,latlon[0]);
					this.range.lon.min = Math.min(this.range.lon.min,latlon[1]);
					this.range.lon.max = Math.max(this.range.lon.max,latlon[1]);
					circle = L.circle(latlon,{ radius: 500 });
					circle.addTo(this.map);
					// Create a circle marker
					this.grid.push(L.rectangle(circle.getBounds(), {
						weight: 0,
						fillColor: '#f03',
						fillOpacity: 0.5
					}));
					circle.removeFrom(this.map);

					// Add the new circle to the map
					this.grid[this.grid.length-1].addTo(this.map);
				}
			}
			
			this.map.fitBounds([[this.range.lat.min,this.range.lon.min],[this.range.lat.max,this.range.lon.max]])

			// Now set the key to use for opacity and update
			this.setKey(this.key);

		}).catch(error => {

			console.error('Failed to load '+url);

		});
		return this;
	}
	
	NOXplorer.prototype.setColourScale = function(scale){
		
		console.info('setColourScale',scale);

		var el,col,i;

		this.scale = scale;

		// Update the scale bar
		this.scalebar.update(this);

		// Update the fill colours
		for(i = 0; i < this.grid.length; i++){
			col = this.colour.getColourFromScale(scale,this.data[i][this.lookup[this.key]],this.range[this.key].min,this.range[this.key].max);
			this.grid[i].setStyle({'fillColor': col});
		}
		
		this.calculate();
		return this;
	}
	
	NOXplorer.prototype.setInterpolation = function(i){
		this.interpolation = i;
		this.calculate();
		return this;
	}

	NOXplorer.prototype.setKey = function(key){
		
		console.info('setKey',key);

		this.key = key;
		
		return this.setColourScale(this.scale);
	}

	root.NOXplorer = NOXplorer;

	/* ============== */
	/* Colours v0.3.2 */
	// Define colour routines
	function Colour(c,n){
		if(!c) return {};

		function d2h(d) { return ((d < 16) ? "0" : "")+d.toString(16);}
		function h2d(h) {return parseInt(h,16);}
		/**
		 * Converts an RGB color value to HSV. Conversion formula
		 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
		 * Assumes r, g, and b are contained in the set [0, 255] and
		 * returns h, s, and v in the set [0, 1].
		 *
		 * @param	Number  r		 The red color value
		 * @param	Number  g		 The green color value
		 * @param	Number  b		 The blue color value
		 * @return  Array			  The HSV representation
		 */
		function rgb2hsv(r, g, b){
			r = r/255;
			g = g/255;
			b = b/255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, v = max;
			var d = max - min;
			s = max == 0 ? 0 : d / max;
			if(max == min) h = 0; // achromatic
			else{
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}
			return [h, s, v];
		}

		this.alpha = 1;

		// Let's deal with a variety of input
		if(c.indexOf('#')==0){
			this.hex = c;
			this.rgb = [h2d(c.substring(1,3)),h2d(c.substring(3,5)),h2d(c.substring(5,7))];
		}else if(c.indexOf('rgb')==0){
			var bits = c.match(/[0-9\.]+/g);
			if(bits.length == 4) this.alpha = parseFloat(bits[3]);
			this.rgb = [parseInt(bits[0]),parseInt(bits[1]),parseInt(bits[2])];
			this.hex = "#"+d2h(this.rgb[0])+d2h(this.rgb[1])+d2h(this.rgb[2]);
		}else return {};
		this.hsv = rgb2hsv(this.rgb[0],this.rgb[1],this.rgb[2]);
		this.name = (n || "Name");
		var r,sat;
		for(r = 0, sat = 0; r < this.rgb.length ; r++){
			if(this.rgb[r] > 200) sat++;
		}
		this.toString = function(){
			return 'rgb'+(this.alpha < 1 ? 'a':'')+'('+this.rgb[0]+','+this.rgb[1]+','+this.rgb[2]+(this.alpha < 1 ? ','+this.alpha:'')+')'
		}
		this.text = (this.rgb[0]*0.299 + this.rgb[1]*0.587 + this.rgb[2]*0.114 > 186 ? "black":"white");
		return this;
	}
	function Colours(){
		var scales = {
			'Viridis': 'rgb(68,1,84) 0%, rgb(72,35,116) 10%, rgb(64,67,135) 20%, rgb(52,94,141) 30%, rgb(41,120,142) 40%, rgb(32,143,140) 50%, rgb(34,167,132) 60%, rgb(66,190,113) 70%, rgb(121,209,81) 80%, rgb(186,222,39) 90%, rgb(253,231,36) 100%',
			'ODI': 'rgb(114,46,165) 0%, rgb(230,0,124) 50%, rgb(249,188,38) 100%',
			'Heat': 'rgb(0,0,0) 0%, rgb(128,0,0) 25%, rgb(255,128,0) 50%, rgb(255,255,128) 75%, rgb(255,255,255) 100%',
			'Planck': 'rgb(0,0,255) 0, rgb(0,112,255) 16.666%, rgb(0,221,255) 33.3333%, rgb(255,237,217) 50%, rgb(255,180,0) 66.666%, rgb(255,75,0) 100%',
			'EPC': '#ef1c3a 1%, #ef1c3a 20.5%, #f78221 20.5%, #f78221 38.5%, #f9ac64 38.5%, #f9ac64 54.5%, #ffcc00 54.5%, #ffcc00 68.5%, #8cc63f 68.5%, #8cc63f 80.5%, #1bb35b 80.5%, #1bb35b 91.5%, #00855a 91.5%, #00855a 120%',
			'Plasma': 'rgb(12,7,134) 0%, rgb(64,3,156) 10%, rgb(106,0,167) 20%, rgb(143,13,163) 30%, rgb(176,42,143) 40%, rgb(202,70,120) 50%, rgb(224,100,97) 60%, rgb(241,130,76) 70%, rgb(252,166,53) 80%, rgb(252,204,37) 90%, rgb(239,248,33) 100%',
			'Referendum': '#4BACC6 0, #B6DDE8 50%, #FFF380 50%, #FFFF00 100%',
			'Leodis': '#2254F4 0%, #F9BC26 50%, #ffffff 100%',
			'Longside': '#801638 0%, #addde6 100%'
		};
		function col(a){
			if(typeof a==="string") return new Colour(a);
			else return a;
		}
		this.getColourPercent = function(pc,a,b){
			pc /= 100;
			a = col(a);
			b = col(b);
			return 'rgb'+(a.alpha<1 || b.alpha<1 ? 'a':'')+'('+parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc)+','+parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc)+','+parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc)+(a.alpha<1 || b.alpha<1 ? ','+((b.alpha-a.alpha)*pc):'')+')';
		};
		this.makeGradient = function(a,b){
			a = col(a);
			b = col(b);
			return 'background: '+a.hex+'; background: -moz-linear-gradient(left, '+a.toString()+' 0%, '+b.toString()+' 100%);background: -webkit-linear-gradient(left, '+a.hex+' 0%,'+b.hex+' 100%);background: linear-gradient(to right, '+a.hex+' 0%,'+b.hex+' 100%);';
		};
		this.addScale = function(id,str){
			scales[id] = str;
			processScale(id,str);
		}
		function processScale(id,str){
			if(scales[id] && scales[id].str){
				console.warn('Colour scale '+id+' already exists. Bailing out.');
				return this;
			}
			scales[id] = {'str':str};
			scales[id].stops = extractColours(str);
			return this;
		}
		function extractColours(str){
			var stops,cs,i,c;
			stops = str.replace(/^\s+/g,"").replace(/\s+$/g,"").replace(/\s\s/g," ").split(', ');
			cs = [];
			for(i = 0; i < stops.length; i++){
				var bits = stops[i].split(/ /);
				if(bits.length==2) cs.push({'v':bits[1],'c':new Colour(bits[0])});
				else if(bits.length==1) cs.push({'c':new Colour(bits[0])});
			}
			
			for(c=0; c < cs.length;c++){
				if(cs[c].v){
					// If a colour-stop has a percentage value provided, 
					if(cs[c].v.indexOf('%')>=0) cs[c].aspercent = true;
					cs[c].v = parseFloat(cs[c].v);
				}
			}
			return cs;
		}

		// Process existing scales
		for(var id in scales){
			if(scales[id]) processScale(id,scales[id]);
		}
		
		// Return a Colour object for a string
		this.getColour = function(str){
			return new Colour(str);
		};
		// Return the colour scale string
		this.getColourScale = function(id){
			return scales[id].str;
		};
		// Return the colour string for this scale, value and min/max
		this.getColourFromScale = function(s,v,min,max){
			var cs,v2,pc,c;
			var colour = "";
			if(!scales[s]){
				console.warn('No colour scale '+s+' exists');
				return '';
			}
			if(typeof min!=="number") min = 0;
			if(typeof max!=="number") max = 1;
			cs = scales[s].stops;
			v2 = 100*(v-min)/(max-min);
			var match = -1;
			if(max-min==0){
				return cs[0].c.toString();
			}
			if(v==max){
				colour = 'rgba('+cs[cs.length-1].c.rgb[0]+', '+cs[cs.length-1].c.rgb[1]+', '+cs[cs.length-1].c.rgb[2]+', ' + cs[cs.length-1].c.alpha + ")";
			}else{
				if(cs.length == 1) colour = 'rgba('+cs[0].c.rgb[0]+', '+cs[0].c.rgb[1]+', '+cs[0].c.rgb[2]+', ' + (v2/100).toFixed(3) + ")";
				else{
					for(c = 0; c < cs.length-1; c++){
						if(v2 >= cs[c].v && v2 <= cs[c+1].v){
							// On this colour stop
							pc = 100*(v2 - cs[c].v)/(cs[c+1].v-cs[c].v);
							if(pc > 100) pc = 100;	// Don't go above colour range
							colour = this.getColourPercent(pc,cs[c].c,cs[c+1].c);
							continue;
						}
					}
				}
			}
	
			return colour;	
		};
		
		return this;
	}

	// Convert Northings and Eastings to Latitude and Longitude using geotools2.js library
	function NEtoLL(coo){

		var osgb = new GT_OSGB();
		osgb.setGridCoordinates(coo[0],coo[1]);
		var wgs84 = osgb.getWGS84();
		return [wgs84.latitude,wgs84.longitude];
		
	}

	// Extend objects
	extendObject = (typeof Object.extend === 'undefined') ? function(destination, source){ for(var property in source){ if (source.hasOwnProperty(property)) destination[property] = source[property]; } return destination; } : Object.extend;

	function sortIndices(toSort){
		var len = toSort.length;
		var indices = new Array(len);
		for(var i = 0; i < len; ++i) indices[i] = i;
		return indices.sort(function (a, b){ return toSort[a] < toSort[b] ? -1 : toSort[a] > toSort[b] ? 1 : 0; });
	}

	root.Colours = Colours;

})(window || this);

// Define a function to check if the page is ready
function ready(f){
	// If the page isn't ready it calls itself every 9 milliseconds
	// Otherwise it calls the function we passed into it
	if(/in/.test(document.readyState)) setTimeout('ready('+f+')',9);
	else f();
};


var app;

// Check if the page is ready
ready(function(){

	app = new NOXplorer({});

});
