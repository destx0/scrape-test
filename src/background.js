import browser from "webextension-polyfill";
import { scrapeQuestion } from "./questionScraper.js";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
	console.log("Extension installed:", details);
});

let isAutoClicking = false;

// Function to get question information
function getQuestionInfo() {
	const questionList = document.querySelector(".questionList");
	const questions = questionList.querySelectorAll("li");
	const activeQuestion = questionList.querySelector(".current-question");

	return {
		total: questions.length,
		active: activeQuestion
			? Array.from(questions).indexOf(activeQuestion) + 1
			: null,
	};
}

// Function to click the "Next" button
function clickNextButton() {
	const nextButton = document.querySelector(
		'button.btn.btn-info-test.pull-right.mar-t0.ng-binding[ng-click="navBtnPressed(true)"]'
	);

	if (nextButton) {
		nextButton.click();
		console.log("Next button clicked");
		return true;
	} else {
		console.log("Next button not found");
		return false;
	}
}

// Function to click the "View Solution" button
function clickViewSolutionButton() {
	const viewSolutionButton = document.querySelector(
		'button.btn.btn-sm.btn-outline-theme.mar-r4[ng-click="toggleViewSolution()"]'
	);

	if (viewSolutionButton) {
		viewSolutionButton.click();
		console.log("View Solution button clicked");
		return true;
	} else {
		console.log("View Solution button not found");
		return false;
	}
}

async function traverseSection(tabId) {
	isAutoClicking = true;

	while (isAutoClicking) {
		// Get current question info
		const questionInfo = await browser.scripting.executeScript({
			target: { tabId: tabId },
			func: getQuestionInfo,
		});

		// Send question info to popup
		browser.runtime.sendMessage({
			action: "updateQuestionInfo",
			info: questionInfo[0].result,
		});

		// Scrape the question
		const scrapedQuestion = await browser.scripting.executeScript({
			target: { tabId: tabId },
			func: scrapeQuestion,
		});

		if (scrapedQuestion[0].result) {
			console.log("Scraped question:", scrapedQuestion[0].result);
			// Here you can send the scraped question to the popup or save it
		}

		// Click View Solution button if available
		await browser.scripting.executeScript({
			target: { tabId: tabId },
			func: clickViewSolutionButton,
		});

		// Wait for 2 seconds to allow solution to load
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Click next button
		const clickResult = await browser.scripting.executeScript({
			target: { tabId: tabId },
			func: clickNextButton,
		});

		if (!clickResult[0].result) {
			console.log(
				"Reached the end of the section or encountered an error. Stopping traversal."
			);
			break;
		}

		// Wait for 100ms before next iteration
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	isAutoClicking = false;
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.action === "getQuestionInfo") {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		const result = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: getQuestionInfo,
		});
		return result[0].result;
	} else if (message.action === "traverseSection") {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		traverseSection(tab.id);
		return true;
	} else if (message.action === "stopTraversal") {
		isAutoClicking = false;
		return true;
	} else if (message.action === "viewSolution") {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		const result = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: clickViewSolutionButton,
		});
		return result[0].result;
	}
});
