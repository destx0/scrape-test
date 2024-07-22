// questionScraper.js

// Function to scrape the question and options
export function scrapeQuestionAndOptions() {
	try {
		const elements = Array.from(
			document.querySelectorAll(".qns-view-box")
		).slice(0, 6);
		const newTags = ["question", "opta", "optb", "optc", "optd", "soln"];
		let result = "";

		if (elements.length > 0) {
			let current = elements[1];
			let ultimateParentUl = null;

			while (current.parentElement) {
				if (current.tagName.toLowerCase() === "ul") {
					ultimateParentUl = current;
					break;
				}
				current = current.parentElement;
			}

			if (ultimateParentUl) {
				const listItems = ultimateParentUl.querySelectorAll("li");
				for (let i = 0; i < listItems.length; i++) {
					if (listItems[i].querySelector(".correctness")) {
						elements.forEach((element, j) => {
							if (j < newTags.length) {
								const newElement = document.createElement(
									newTags[j]
								);
								newElement.innerHTML = element.innerHTML;
								result += newElement.outerHTML + "\n\n";
							}
						});
						result += `<correctOption>${i}</correctOption>\n\n`;
						break;
					}
				}
			}
		}

		console.log("Scraped data:", result);
		return {
			parsedContent: result,
			questionCount: elements.length,
		};
	} catch (error) {
		console.error("Error in scrapeQuestionAndOptions:", error);
		return { error: error.message };
	}
}
