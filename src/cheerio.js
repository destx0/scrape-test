// cheerio.js

// Fetch Cheerio from CDN and add it to the global scope
(function () {
	var script = document.createElement("script");
	script.src =
		"https://cdnjs.cloudflare.com/ajax/libs/cheerio/1.0.0-rc.12/cheerio.min.js";
	script.type = "text/javascript";
	script.async = true;
	script.onload = function () {
		// This function will be called when Cheerio is loaded
		console.log("Cheerio loaded successfully");
	};
	document.head.appendChild(script);
})();
