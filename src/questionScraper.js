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

// Function to scrape the options
function scrapeOptions() {
	const optionsContainer = document.querySelector(
		".list-unstyled.clearfix.mar-b24"
	);
	if (!optionsContainer) {
		console.log("Options container not found");
		return null;
	}

	const optionElements = optionsContainer.querySelectorAll(".option");
	const options = Array.from(optionElements).map((optionElement, index) => {
		const optionText =
			optionElement.querySelector(".qns-view-box").innerText;
		const isCorrect = optionElement.classList.contains("correct-option");
		const isSelected =
			optionElement.classList.contains("actual-incorrect-option") ||
			isCorrect;

		return {
			text: optionText,
			isCorrect: isCorrect,
			isSelected: isSelected,
			index: index,
		};
	});

	console.log("Scraped options:", options);
	return options;
}

// Function to scrape both question and options
function scrapeQuestionAndOptions() {
	const question = scrapeQuestion();
	const options = scrapeOptions();

	const scrapedData = {
		question: question,
		options: options,
	};

	console.log("Scraped question and options:", scrapedData);
	return scrapedData;
}

export { scrapeQuestion, scrapeOptions, scrapeQuestionAndOptions };
