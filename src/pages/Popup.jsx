import React, { useState, useEffect } from "react";
import browser from "webextension-polyfill";
import "./Popup.css";

export default function Popup() {
	const [status, setStatus] = useState("");
	const [isTraversing, setIsTraversing] = useState(false);
	const [questionInfo, setQuestionInfo] = useState({
		total: 0,
		active: null,
	});

	useEffect(() => {
		console.log("Hello from the popup!");
		updateQuestionInfo();

		// Listen for question info updates from the background script
		browser.runtime.onMessage.addListener((message) => {
			if (message.action === "updateQuestionInfo") {
				setQuestionInfo(message.info);
			}
		});
	}, []);

	const updateQuestionInfo = async () => {
		try {
			const info = await browser.runtime.sendMessage({
				action: "getQuestionInfo",
			});
			setQuestionInfo(info);
		} catch (error) {
			console.error("Error getting question info:", error);
		}
	};

	const handleTraverseSection = async () => {
		if (isTraversing) {
			setStatus("Stopping traversal...");
			await browser.runtime.sendMessage({ action: "stopTraversal" });
			setIsTraversing(false);
			setStatus("Traversal stopped.");
		} else {
			setStatus("Starting section traversal...");
			setIsTraversing(true);
			try {
				await browser.runtime.sendMessage({
					action: "traverseSection",
				});
			} catch (error) {
				console.error("Error during traversal:", error);
				setStatus(`Error during traversal: ${error.message}`);
				setIsTraversing(false);
			}
		}
	};

	const handleViewSolution = async () => {
		setStatus("Attempting to view solution...");
		try {
			const result = await browser.runtime.sendMessage({
				action: "viewSolution",
			});
			if (result) {
				setStatus("Solution viewed successfully.");
			} else {
				setStatus("View Solution button not found.");
			}
		} catch (error) {
			console.error("Error viewing solution:", error);
			setStatus(`Error viewing solution: ${error.message}`);
		}
	};

	return (
		<div>
			<img src="/icon-with-shadow.svg" alt="Extension icon" />
			<h1>Testbook Automation</h1>
			<p>Current section: {questionInfo.total} questions</p>
			<p>
				Active question:{" "}
				{questionInfo.active !== null ? questionInfo.active : "N/A"}
			</p>
			<button onClick={handleTraverseSection}>
				{isTraversing ? "Stop Traversal" : "Start Traversal"}
			</button>
			<button onClick={handleViewSolution}>View Solution</button>
			{status && <p>{status}</p>}
		</div>
	);
}
