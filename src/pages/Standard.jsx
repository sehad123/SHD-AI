import { useState } from "react";
import React from "react";
import { Link } from "react-router-dom";
import MarkdownIt from "markdown-it";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import "../App.css";

const API_KEY = "AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ";

function Pro() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false); // Dropdown visibility state

  const handleShopsyClick = () => {
    window.location.href = "/pro"; // Ganti "/home" dengan URL beranda Anda
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOutput("Generating...");

    try {
      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      setPrompt("");

      const result = await model.generateContentStream({ contents });

      const buffer = [];
      const md = new MarkdownIt();
      for await (const response of result.stream) {
        buffer.push(response.text());
        setOutput(md.render(buffer.join("")));
      }

      const historyItem = {
        id: history.length,
        prompt,
        output: buffer.join(""),
      };

      setHistory([...history, historyItem]);
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    }
  };

  const handleHistoryClick = (item) => {
    setOutput(item.output);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      alert("Output copied to clipboard");
    });
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <div>
      <div className="main-container">
        <div className="history-container">
          <h2 className="history-title">History</h2>
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id} className="history-item" onClick={() => handleHistoryClick(item)}>
                {item.prompt}
              </li>
            ))}
          </ul>
        </div>
        <div className="chat-container">
          <div className="header">
            <div className="title-container" onClick={toggleDropdown}>
              <h1 className="title">SHD.AI</h1>
              <span className="dropdown-icon">▼</span>
            </div>
            {dropdownVisible && (
              <ul className="dropdown-menu">
                <li className="cursor-pointer p-2">
                  <Link to="#" className="block w-full h-full">
                    Versi Standard
                  </Link>
                </li>
                <li className="cursor-pointer p-2" onClick={handleShopsyClick}>
                  <Link to="#" className="block w-full h-full">
                    Versi Pro
                  </Link>
                </li>
              </ul>
            )}
          </div>
          <div className="output-container">
            {output && <div className="output" dangerouslySetInnerHTML={{ __html: output }}></div>}
            {output && (
              <button id="copy-button" className="copy-button" onClick={handleCopy}>
                🧾
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="form">
            <div className="prompt-box">
              <input name="prompt" className="prompt-input" placeholder="Masukkan Perintah anda" type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <button type="submit" className="submit-button">
                ▶
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Pro;
