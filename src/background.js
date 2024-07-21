import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
	console.log("Extension installed:", details);
});

let isAutoClicking = false;

// Function to click the "Next" button using multiple selection methods
function clickNextButton() {
	// Method 1: querySelector
	let nextButton = document.querySelector(
		'button.btn.btn-info-test.pull-right.mar-t0.ng-binding[ng-click="navBtnPressed(true)"]'
	);

	// Method 2: XPath
	if (!nextButton) {
		const xpath =
			'//button[@class="btn btn-info-test pull-right mar-t0 ng-binding" and @ng-click="navBtnPressed(true)"]';
		nextButton = document.evaluate(
			xpath,
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
	}

	// Method 3: JavaScript path
	if (!nextButton) {
		nextButton = document.querySelector(
			"#questions > div.footer.mob-button-footer > div.footer-inner > button.btn.btn-info-test.pull-right.mar-t0.ng-binding"
		);
	}

	if (nextButton) {
		nextButton.click();
		console.log("Next button clicked");
		return true;
	} else {
		console.log("Next button not found");
		return false;
	}
}

async function autoClickNext(tabId, maxClicks) {
	isAutoClicking = true;
	let clickCount = 0;

	while (isAutoClicking && clickCount < maxClicks) {
		const result = await browser.scripting.executeScript({
			target: { tabId: tabId },
			func: clickNextButton,
		});

		if (!result[0].result) {
			console.log("Failed to click Next button. Stopping auto-click.");
			break;
		}

		clickCount++;
		console.log(`Clicked ${clickCount} times`);

		await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
	}

	isAutoClicking = false;
	return clickCount;
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.action === "clickNext") {
		try {
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});
			const result = await browser.scripting.executeScript({
				target: { tabId: tab.id },
				func: clickNextButton,
			});
			return result[0].result;
		} catch (error) {
			console.error("Error executing script:", error);
			return false;
		}
	} else if (message.action === "autoClickNext") {
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		return autoClickNext(tab.id, 100);
	} else if (message.action === "stopAutoClick") {
		isAutoClicking = false;
		return true;
	}
});
