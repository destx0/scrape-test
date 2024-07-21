// Function to scrape the question content
function scrapeQuestion() {
	const questionElement = document.querySelector(
		".mar-b16.qns-view-box.ng-binding"
	);
	if (!questionElement) {
		console.log("Question element not found");
		return null;
	}

	let questionText = questionElement.innerText;

	// Check if the question contains LaTeX
	const latexElements = questionElement.querySelectorAll(".math-tex");
	if (latexElements.length > 0) {
		// Replace LaTeX elements with placeholders
		latexElements.forEach((el, index) => {
			const latexContent =
				el.querySelector('script[type="math/tex"]')?.textContent || "";
			questionText = questionText.replace(
				el.textContent,
				`[LATEX_${index}]`
			);
			questionText += `\n[LATEX_${index}]: ${latexContent}`;
		});
	}

	console.log("Scraped question:", questionText);
	return questionText;
}

export { scrapeQuestion };
