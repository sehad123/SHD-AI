import { useState } from "react";
import MarkdownIt from "markdown-it";
import { Link } from "react-router-dom";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import "../App.css";

const API_KEY = "AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ";

function Pro() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(true); // Set dark mode by default
  const [dropdownVisible, setDropdownVisible] = useState(false); // Dropdown visibility state

  const handleShopsyClick = () => {
    window.location.href = "/"; // Ganti "/home" dengan URL beranda Anda
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setFilePreview(""); // Clear file preview when image is selected
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile) {
      setFilePreview(selectedFile.name); // Show file name as preview
      setImagePreview(""); // Clear image preview when file is selected
    } else {
      setImagePreview("");
      setFilePreview("");
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOutput("Generating...");

    try {
      let fileContent = "";
      let imageBase64 = null;

      if (file) {
        if (file.type.startsWith("image/")) {
          imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else {
          fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        }
      }

      const contents = [
        {
          role: "user",
          parts: [imageBase64 ? { inline_data: { mime_type: file.type, data: imageBase64 } } : null, fileContent ? { text: fileContent } : null, { text: prompt }].filter(Boolean),
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
      setFile(null);
      setImagePreview("");
      setFilePreview("");

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

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <div className="main-container">
        <div className="history-container">
          <h2 className="history-title text-center">History</h2>
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
            <div className="title-container -translate-y-8 lg:translate-y-0" onClick={toggleDropdown}>
              <h1 className="title">SHD.AI</h1>
              <span className="dropdown-icon">▼</span>
            </div>
            <button className="dark-mode-button -translate-y-8 lg:translate-y-0" onClick={handleToggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            {dropdownVisible && (
              <ul className="dropdown-menu">
                <li>
                  <Link to="/" onClick={handleShopsyClick}>
                    Version Standard
                  </Link>
                </li>
                <li>
                  <Link to="#">Versi Pro</Link>
                </li>
              </ul>
            )}
          </div>
          <div className="output-container -mt-10 lg:mt-0">
            {output && <div className="output" dangerouslySetInnerHTML={{ __html: output }}></div>}
            {output && (
              <button id="copy-button" className="copy-button" onClick={handleCopy}>
                🧾
              </button>
            )}
          </div>
          {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
          {filePreview && !imagePreview && <div className="file-preview">{filePreview}</div>}
          <form onSubmit={handleSubmit} className="form">
            <div className="prompt-box">
              <label className="upload-icon">
                <input type="file" id="file-upload" onChange={handleFileChange} />
                <span role="img" aria-label="upload">
                  📁
                </span>
              </label>
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
