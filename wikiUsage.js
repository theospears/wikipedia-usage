/* BEGIN Array Functions */

Array.prototype.map = function(transformation) {
	var results = [];
	for(var i = 0; i < this.length; i++) {
		results.push(transformation(this[i]));
	}
	return results;
}

Array.prototype.distinct = function() {
	var result = [];
	var set = {}
	for(var i = 0; i < this.length; i++) {
		if(!(this[i] in set)) {
			set[this[i]] = true;
			result.push(this[i]);
		}
	}
	return result;
}

Array.prototype.forEach = function(action) {
	for(var i = 0; i < this.length; i++) {
		action(this[i]);
	}
}

Array.prototype.group = function(groupFunction, groupNames) {
	groups = {}
	if(groupNames !== undefined) {
		groupNames.forEach(function(it) {
			groups[it] = [];
		});
	}

	this.forEach(function(it) {
		var key = groupFunction(it);
		if(key in groups) {
			groups[key].push(it);
		} else if(groupNames === undefined) {
			groups[key] = [it]; 
		}
	});
	return groups;
}

Array.prototype.sum = function() {
	var total = 0;
	this.forEach(function(it) {
		total += it;
	});
	return total;
}

Array.prototype.max = function() {
	var max = this[0];
	this.forEach(function(it) {
		if(max < it) {
			max = it;
		}
	});
	return max;
}

Array.prototype.toHash = function() {
	var result = {};
	this.forEach(function(obj){
		if(!(obj instanceof Array)) {
			throw "Contains non array value";
		}
		if(obj.length != 2) {
			throw "Sub-array not of the correct length";
		}
		if(obj[0] in result) {
			throw "Duplicate key found";
		}
		result[obj[0]] = obj[1];
	});
	return result;
}

/* END Array Functions */

/* BEGIN Object functions */

function mapValues(it, mapFunction) {
	result = {};
	result.__proto__ = it.__proto__;
	for(var name in it) {
		if(it.hasOwnProperty(name)) {
				result[name] = mapFunction(it[name]);
		}
	}
	return result;
}

function asPairs(it) {
	results = [];
	for(var name in it) {
		if(it.hasOwnProperty(name)) {
				results.push([name, it[name]]);
		}
	}
	return results;
}

/* END Object functions */

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


function toDayValuePairs(hash) {
	result = []
	for(var name in hash) {
		if(hash.hasOwnProperty(name)) {
				result.push([name.replace(/.*-/,''), hash[name]]);
		}
	}
	return result;
}

function values(hash) {
	result = []
	for(var name in hash) {
		if(hash.hasOwnProperty(name)) {
				result.push(hash[name]);
		}
	}
	return result;
}

function setInnerText(elementId, contents) {
	document.getElementById(elementId).innerText = contents;
}


function renderHash(hash, containerId) {
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'date');
		data.addColumn('number', 'pageviews');

		data.addRows(toDayValuePairs(hash));
		var width = document.getElementById(containerId).offsetWidth;
		if(width > 1000) {
			width = 1000;
		}

		var wrapper = new google.visualization.ChartWrapper({
			chartType: 'ImageChart',
			dataTable: data,
			options: { cht: 'bvg', width: width, legend: 'none', chxt: 'x,y', chxs: '1,,0,0,_'  },
			containerId: containerId
		});
		wrapper.draw();
}

function setFrequentArticles(articles) {
	var mostPopularList = document.getElementById('mostPopularList');
	var maxReads = articles[0][1];
	articles.forEach(function(it) {
		var popArticle = document.createElement('div');
		popArticle.setAttribute('class', 'popularArticle');
		popArticle.innerHTML = 
							'<div class="horizontalBarContainer">' +
							'	<div class="horizontalBar" style="width: ' + (it[1]*100/maxReads) + '%">&nbsp;</div>' +
							'</div>' +
							'<div class="articleTitle">' +
							'	<a href="' + it[0] +'">' + it[0].replace(/.*\//,'').replace(/_/g,' ') + '</a>' +
							'</div>';
		mostPopularList.appendChild(popArticle);
	});
}

function setRecentArticles(articles) {
	var mostRecentList = document.getElementById('mostRecentList');
	articles.forEach(function(it) {
		var recentArticle = document.createElement('div');
		recentArticle.setAttribute('class', 'recentArticle');
		console.log(it);
		recentArticle.innerHTML = 
							'<div class="articleDate">' + 
							humaneDate(new Date(it[1])) + 
							'</div>' + 
							'<div class="articleTitle">' + 
							'	<a href="' + it[0] + '">' + it[0].replace(/.*\//,'').replace(/_/g,' ') + '</a>' + 
							'</div>'
		mostRecentList.appendChild(recentArticle);
	});
}

function renderWikiUsage() {
	getWikipediaVisits(function(visits){
		var usageByDay = visits.group(
			function(visit) { return dateOnly(visit.lastVisitTime) },
			getRecentDates());
		var usageCountsByDay = mapValues(usageByDay, function(visits){return visits.length;});

		renderHash(usageCountsByDay, 'graphDaysLastMonth');

		var articlesRead = visits.map(function(v){return v.url.replace(/#.*/,'');}).distinct().length
		setInnerText('numArticlesRead', articlesRead);
		setInnerText('donationAmount', (articlesRead * 0.05).toFixed(2));

		var equivArticles = visits.group(function(v){return v.url.replace(/#.*/,'');});
		var frequencies = asPairs(mapValues(
			equivArticles,
			function(values) { return values.map(function(v){return v.visitCount; }).sum(); }));
		frequencies.sort(function(a,b) { return b[1] - a[1] });

		setFrequentArticles(frequencies.slice(0,5));

		var mostRecent = asPairs(mapValues(
			equivArticles,
			function(values) { return values.map(function(v){return v.lastVisitTime; }).max(); }));
		mostRecent.sort(function(a,b) { return b[1] - a[1] });

		setRecentArticles(mostRecent.slice(0,5));
	});
	
}
