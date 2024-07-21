import React, { useState, useEffect } from "react";
import browser from "webextension-polyfill";
import "./Popup.css";

export default function Popup() {
	const [status, setStatus] = useState("");
	const [isAutoClicking, setIsAutoClicking] = useState(false);

	useEffect(() => {
		console.log("Hello from the popup!");
	}, []);

	const handleClickNext = async () => {
		setStatus("Attempting to click Next...");
		try {
			const result = await browser.runtime.sendMessage({
				action: "clickNext",
			});
			if (result) {
				setStatus("Next button clicked successfully.");
			} else {
				setStatus("Next button not found or could not be clicked.");
			}
		} catch (error) {
			setStatus(`Error: ${error.message}`);
		}
	};

	const handleAutoClickNext = async () => {
		if (isAutoClicking) {
			setStatus("Stopping auto-click...");
			await browser.runtime.sendMessage({ action: "stopAutoClick" });
			setIsAutoClicking(false);
			setStatus("Auto-click stopped.");
		} else {
			setStatus("Starting auto-click (max 100 times with 3s delay)...");
			setIsAutoClicking(true);
			try {
				const clickCount = await browser.runtime.sendMessage({
					action: "autoClickNext",
				});
				setIsAutoClicking(false);
				setStatus(`Auto-click completed. Clicked ${clickCount} times.`);
			} catch (error) {
				setIsAutoClicking(false);
				setStatus(`Error during auto-click: ${error.message}`);
			}
		}
	};

	return (
		<div>
			<img src="/icon-with-shadow.svg" alt="Extension icon" />
			<h1>Testbook Automation</h1>
			<p>
				Click the buttons below to automate the "Next" button on
				Testbook.com
			</p>
			<button onClick={handleClickNext}>Click Next Once</button>
			<button onClick={handleAutoClickNext}>
				{isAutoClicking ? "Stop Auto-Click" : "Start Auto-Click"}
			</button>
			{status && <p>{status}</p>}
		</div>
	);
}
