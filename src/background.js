import browser from "webextension-polyfill";
import { scrapeQuestionAndOptions } from "./questionScraper.js";

console.log("Hello from the background!");

let isAutoClicking = false;

browser.runtime.onInstalled.addListener((details) => {
	console.log("Extension installed:", details);
});

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

		// Scrape the question and options
		const scrapedData = await browser.scripting.executeScript({
			target: { tabId: tabId },
			func: scrapeQuestionAndOptions,
		});

		if (scrapedData[0].result) {
			console.log("Scraped data:", scrapedData[0].result);
			// Send scraped data to popup
			browser.runtime.sendMessage({
				action: "updateScrapedData",
				data: scrapedData[0].result,
			});
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

		// Wait for 1 second before next iteration
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	isAutoClicking = false;
	// Notify popup that traversal has ended
	browser.runtime.sendMessage({ action: "traversalEnded" });
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
	} else if (message.action === "scrapeCurrentQuestion") {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		const result = await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: scrapeQuestionAndOptions,
		});
		console.log("Manually scraped data:", result[0].result);
		return result[0].result;
	}
});

// Optional: Add listener for tab updates to potentially trigger actions when the page changes
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url.includes("testbook.com")) {
		console.log("Testbook page loaded");
		// You can trigger initial actions here if needed
	}
});
