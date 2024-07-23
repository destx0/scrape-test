// background.js

import { scrapeQuestionAndOptions } from "./questionScraper.js";

console.log("Hello from the background!");

let isAutoClicking = false;
let accumulatedData = [];

chrome.runtime.onInstalled.addListener((details) => {
	console.log("Extension installed:", details);
	accumulatedData = []; // Clear data only on install/update
});

// Function to get question information
function getQuestionInfo() {
	const questionList = document.querySelector(".questionList");
	if (!questionList) {
		console.error("Question list not found");
		return null;
	}
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
	let k = 0;
	while (isAutoClicking && k < 99) {
		// Get current question info
		const questionInfo = await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: getQuestionInfo,
		});

		if (questionInfo[0].result) {
			// Send question info to popup
			chrome.runtime.sendMessage({
				action: "updateQuestionInfo",
				info: questionInfo[0].result,
			});
		} else {
			console.error("Failed to get question info");
		}

		// Scrape the question and options using the new function
		const scrapedData = await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: scrapeQuestionAndOptions,
		});

		if (scrapedData[0].result && !scrapedData[0].result.error) {
			console.log(scrapedData[0].result.parsedContent);
			accumulatedData.push(scrapedData[0].result); // Accumulate data

			// Send scraped data to popup
			chrome.runtime.sendMessage({
				action: "updateScrapedData",
				data: scrapedData[0].result,
			});
		} else {
			console.error(
				"Error scraping question:",
				scrapedData[0].result
					? scrapedData[0].result.error
					: "Unknown error"
			);
		}

		// Click View Solution button if available
		await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: clickViewSolutionButton,
		});

		// Wait for 2 seconds to allow solution to load
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Click next button
		const clickResult = await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: clickNextButton,
		});

		if (!clickResult[0].result) {
			console.log(
				"Reached the end of the section or encountered an error. Stopping traversal."
			);
			break;
		}

		await new Promise((resolve) => setTimeout(resolve, 10));

		k++;
	}
	// k = 0;
	// isAutoClicking = false;
	// // Notify popup that traversal has ended
	// chrome.runtime.sendMessage({
	// 	action: "traversalEnded",
	// 	accumulatedData: accumulatedData,
	// });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getQuestionInfo") {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			async (tabs) => {
				try {
					const result = await chrome.scripting.executeScript({
						target: { tabId: tabs[0].id },
						func: getQuestionInfo,
					});
					sendResponse(result[0].result);
				} catch (error) {
					console.error("Error getting question info:", error);
					sendResponse(null);
				}
			}
		);
		return true; // Indicates we will send a response asynchronously
	} else if (message.action === "traverseSection") {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			traverseSection(tabs[0].id);
		});
		sendResponse(true);
		return false;
	} else if (message.action === "stopTraversal") {
		isAutoClicking = false;
		sendResponse(true);
		return false;
	} else if (message.action === "viewSolution") {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			async (tabs) => {
				try {
					const result = await chrome.scripting.executeScript({
						target: { tabId: tabs[0].id },
						func: clickViewSolutionButton,
					});
					sendResponse(result[0].result);
				} catch (error) {
					console.error("Error viewing solution:", error);
					sendResponse(false);
				}
			}
		);
		return true;
	} else if (message.action === "scrapeCurrentQuestion") {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			async (tabs) => {
				try {
					const result = await chrome.scripting.executeScript({
						target: { tabId: tabs[0].id },
						func: scrapeQuestionAndOptions,
					});
					if (result[0].result && !result[0].result.error) {
						console.log(
							"Manually scraped data:",
							result[0].result.parsedContent
						);
						sendResponse(result[0].result);
					} else {
						console.error(
							"Error scraping question:",
							result[0].result
								? result[0].result.error
								: "Unknown error"
						);
						sendResponse(null);
					}
				} catch (error) {
					console.error("Error scraping current question:", error);
					sendResponse(null);
				}
			}
		);
		return true;
	}
});

// Optional: Add listener for tab updates to potentially trigger actions when the page changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url.includes("testbook.com")) {
		console.log("Testbook page loaded");
		// You can trigger initial actions here if needed
	}
});
