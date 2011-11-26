function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

function getWikipediaVisits(callback) {
  var microsecondsPerMonth = 1000 * 60 * 60 * 24 * 31;
  var oneMonthAgo = (new Date).getTime() - microsecondsPerMonth; // For now


  chrome.history.search({
      'text': 'wikipedia.org',  // Not sufficient but cuts things down a bit
      'startTime': oneMonthAgo,
			'maxResults': 5000 // We should potentially batch and retry until we have enough results
    },
    function(historyItems) {
			var wikiItems = [];
			for(var i = 0; i < historyItems.length; i++) {
				var url = historyItems[i].url;
				var parsedUrl = parseUri(url);
				var host = parsedUrl.host;
				var path = parsedUrl.path;
				if(host.match(/(^|\.)wikipedia\.org$/) && path.match(/^\/wiki\//)) {
					wikiItems.push(historyItems[i]);
				} 
			}
			callback(wikiItems);
		}
	);
}

function dateOnly(milliseconds) {
	if(milliseconds === undefined) {
		milliseconds = new Date().getTime();
	}

	var fullTime = new Date(milliseconds);
	var dateString = fullTime.getFullYear() + "-" + fullTime.getMonth() + "-" + fullTime.getDate();
	return dateString;
}

function getRecentDates() {
	recentDates = []

	dateInMilliseconds = new Date().getTime();
	for(var i = 0; i < 30; i++) {
		recentDates.push(dateOnly(dateInMilliseconds));
		dateInMilliseconds -= 1000 * 60 * 60 * 24;   // BUG: This probably fails with daylight saving.
	}
	recentDates.reverse();

	return recentDates;
}

function assignToBuckets(bucketNames, objects, bucketChoiceFunction) {
	buckets = {}
	for(var i = 0; i < bucketNames.length; i++) {
		buckets[bucketNames[i]] = [];
	}

	for(var objectIndex = 0; objectIndex < objects.length; objectIndex++) {
		var key = bucketChoiceFunction(objects[objectIndex]);
		if(key in buckets) {
			buckets[key].push(objects[objectIndex]);
		}
	}

	return buckets;
}

function mapValues(hash, mapFunction) {
	result = {}
	for(var name in hash) {
		if(hash.hasOwnProperty(name)) {
				result[name] = mapFunction(hash[name]);
		}
	}
	return result;
}

function hashToTuples(hash) {
	result = []
	for(var name in hash) {
		if(hash.hasOwnProperty(name)) {
				result.push([hash[name]]);
		}
	}
	return result;

}

function renderHash(hash, containerId) {
		var data = new google.visualization.DataTable();
		//data.addColumn('string', 'date');
		data.addColumn('number', 'pageviews');

		data.addRows(hashToTuples(hash));
		var width = document.getElementById(containerId).offsetWidth;

		var wrapper = new google.visualization.ChartWrapper({
			chartType: 'ImageChart',
			dataTable: data,
			options: { cht: 'bvg', width: width, legend: 'none', chxt: 'y', chco: '76A4FB', chxs: '0,,0,0,_' },
			containerId: containerId
		});
		wrapper.draw();
}

function renderWikiUsage() {
	getWikipediaVisits(function(visits){
		var usageByDay = assignToBuckets(
			getRecentDates(),
			visits,
			function(visit) { return dateOnly(visit.lastVisitTime) });
		var usageCountsByDay = mapValues(usageByDay, function(visits){return visits.length;});

		renderHash(usageCountsByDay, 'graphDaysLastMonth');
	});
}
