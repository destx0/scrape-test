import React, { useState, useEffect, useRef } from "react";
import browser from "webextension-polyfill";
import "./Popup.css";

export default function Popup() {
	const [status, setStatus] = useState("");
	const [isTraversing, setIsTraversing] = useState(false);
	const [questionInfo, setQuestionInfo] = useState({
		total: 0,
		active: null,
	});
	const [scrapedData, setScrapedData] = useState(null);
	const accumulatedDataRef = useRef([]);

	useEffect(() => {
		console.log("Hello from the popup!");
		updateQuestionInfo();
		fetchAccumulatedData();

		// Listen for question info updates from the background script
		browser.runtime.onMessage.addListener((message) => {
			if (message.action === "updateQuestionInfo") {
				setQuestionInfo(message.info);
			} else if (message.action === "updateScrapedData") {
				setScrapedData(message.data);
				// Update accumulated data
				accumulatedDataRef.current = [
					...accumulatedDataRef.current,
					message.data,
				];
			} else if (message.action === "traversalEnded") {
				setIsTraversing(false);
				setStatus("Traversal completed.");
				// updateAccumulatedData(message.accumulatedData);
			}
		});
	}, []);

	const fetchAccumulatedData = async () => {
		try {
			const response = await browser.runtime.sendMessage({
				action: "getAccumulatedData",
			});
			accumulatedDataRef.current = response.accumulatedData;
			setStatus(
				`Loaded ${response.accumulatedData.length} accumulated questions.`
			);
		} catch (error) {
			console.error("Error fetching accumulated data:", error);
			setStatus("Error fetching accumulated data.");
		}
	};

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

	const updateAccumulatedData = (data) => {
		accumulatedDataRef.current = data;
		setStatus(`Accumulated ${data.length} questions.`);
	};

	const handleTraverseSection = async () => {
		if (isTraversing) {
			// setStatus("Stopping traversal...");
			// await browser.runtime.sendMessage({
			// 	action: "stopTraversal",
			// });
			// setIsTraversing(false);
			// setStatus("Traversal stopped.");
		} else {
			setStatus("Starting section traversal...");
			setIsTraversing(true);

			await browser.runtime.sendMessage({
				action: "traverseSection",
			});
		}
	};

	const handleViewSolution = async () => {
		// ... (unchanged)
	};

	const handleScrapeCurrentQuestion = async () => {
		// ... (unchanged)
	};

	const saveAccumulatedData = () => {
		const blob = new Blob(
			[JSON.stringify(accumulatedDataRef.current, null, 2)],
			{ type: "application/json" }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "scraped_data.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		setStatus("Data saved to file.");
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
			<button onClick={handleScrapeCurrentQuestion}>
				Scrape Current Question
			</button>
			<button onClick={saveAccumulatedData}>Save Accumulated Data</button>
			{status && <p>{status}</p>}
			{scrapedData && (
				<div>
					<h2>Last Scraped Question Data:</h2>
					<pre>{JSON.stringify(scrapedData, null, 2)}</pre>
				</div>
			)}
		</div>
	);
}
