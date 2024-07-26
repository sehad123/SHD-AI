import { useState } from "react";
import MarkdownIt from "markdown-it";
import { Link } from "react-router-dom";
import { FaRegThumbsUp, FaThumbsUp, FaRedo, FaVolumeUp, FaCopy, FaCheck } from "react-icons/fa";
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
  const [historyVisible, setHistoryVisible] = useState(false); // History visibility state
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // Like state
  const [isGenerating, setIsGenerating] = useState(false); // Generation state

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
    setIsGenerating(true);
    setIsLiked(false); // Reset like state
    window.scrollTo(0, 0); // Scroll ke atas 100 piksel

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
      setPrompt("");
      setFile(null);
      setImagePreview("");
      setFilePreview("");
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHistoryClick = (item) => {
    setOutput(item.output);
    setHistoryVisible(false); // Hide history container on mobile view
  };

  const handleCopy = () => {
    const div = document.createElement("div");
    div.innerHTML = output;
    const text = div.textContent || div.innerText || "";
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    });
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const toggleHistory = () => {
    setHistoryVisible(!historyVisible);
  };

  const speakOutput = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(output.replace(/<[^>]*>/g, ""));
      speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support speech synthesis.");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleRegenerate = async () => {
    await handleSubmit({ preventDefault: () => {} });
  };

  const Menu1 = [
    {
      name: "Versi Standard",
      link: "/",
    },
    {
      name: "Versi pro",
      link: "/pro",
    },
  ];

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <div className="main-container">
        <div className="history-icon flex lg:hidden md:hidden ml-2 mt-2" onClick={toggleHistory}>
          📑
        </div>
        {/* History container */}
        <div className={`history-container ${historyVisible ? "full-screen" : ""} ${historyVisible ? "block" : "hidden"} lg:block md:block`}>
          <div className="close-icon lg:hidden md:hidden" onClick={toggleHistory}>
            ❌
          </div>
          <h2 className="history-title text-center">History</h2>
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id} className="history-item" onClick={() => handleHistoryClick(item)}>
                {item.prompt}
              </li>
            ))}
          </ul>
        </div>
        <div className="chat-container mt-5 lg:mt-0 md:mt-0">
          <div className="header">
            <div className="title-container -translate-y-8 lg:translate-y-0 mx-auto lg:mx-0 md:mx-0" onClick={toggleDropdown}>
              <h1 className="title">SHD.AI</h1>
              <span className="dropdown-icon">▼</span>
            </div>
            <button className="dark-mode-button -translate-y-8 lg:-translate-y-5" onClick={handleToggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            {dropdownVisible && (
              <ul className="dropdown-menu ml-24 lg:mt-3 lg:ml-0 md:ml-0">
                {Menu1.map((menuItem, index) => (
                  <li key={index} className="cursor-pointer p-2">
                    <Link to={menuItem.link} className="block w-full h-full">
                      {menuItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="output-container -mt-10 lg:mt-0 border border-white lg:border-gray-200 md:border-gray-200 dark:border-none dark:lg:border-gray-200 dark:md:border-gray-200">
            {output && <div className="output" dangerouslySetInnerHTML={{ __html: output }}></div>}
            {output && !isGenerating && (
              <div className="icon-container mt-4 flex gap-4">
                <button id="sound-button" className="sound-button lg:bottom-[95px] lg:right-[140px] md:bottom-[90px] md:right-[140px] bottom-40 right-40" onClick={speakOutput}>
                  <FaVolumeUp />
                </button>
                <button id="like-button" className={`like-button lg:bottom-[95px] lg:right-[110px] md:bottom-[90px] md:right-[110px] bottom-40 right-32 ${isLiked ? "liked" : ""}`} onClick={handleLike}>
                  {isLiked ? <FaThumbsUp color="blue" /> : <FaRegThumbsUp />}
                </button>
                <button id="regenerate-button" className="regenerate-button lg:bottom-[95px] lg:right-[80px] md:bottom-[90px] md:right-[80px] bottom-40 right-24" onClick={handleRegenerate}>
                  <FaRedo />
                </button>
                <button id="copy-button" className="copy-button lg:bottom-[95px] lg:right-[30px] md:bottom-[90px] md:right-[30px] bottom-40 right-8" onClick={handleCopy}>
                  {isCopied ? <FaCheck color="green" /> : <FaCopy />}
                </button>
              </div>
            )}
          </div>
          {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
          {filePreview && !imagePreview && <div className="file-preview">{filePreview}</div>}
          <form onSubmit={handleSubmit} className="form mb-16 lg:mb-0 md:mb-0">
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
