import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MarkdownIt from "markdown-it";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { FaRegThumbsUp, FaThumbsUp, FaCopy, FaCheck } from "react-icons/fa";
import "../App.css";

const API_KEY = "AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ";

function Standard() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [chat, setChat] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);

  useEffect(() => {
    const initializeChat = async () => {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = await genAI.getGenerativeModel({
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

      const newChat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      setChat(newChat);
    };

    initializeChat();
  }, []);

  const handleSubmit = async (promptValue = null, e) => {
    e.preventDefault();
    setShowInitialMessage(false);
    setOutput("Generating...");
    setIsGenerating(true);
    setIsLiked(false);
    window.scrollTo(0, 0);

    try {
      const value = promptValue || prompt;
      setPrompt("");

      const result = await chat.sendMessageStream(value);

      const buffer = [];
      const md = new MarkdownIt();
      for await (const response of result.stream) {
        buffer.push(response.text());
        setOutput(md.render(buffer.join("")));
      }

      const historyItem = {
        id: history.length,
        prompt: value,
        output: buffer.join(""),
      };

      setHistory([...history, historyItem]);
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleHistoryClick = (item) => {
    setOutput(item.output);
    setHistoryVisible(false);
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

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const toggleHistory = () => {
    setHistoryVisible(!historyVisible);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const Menu1 = [
    {
      name: "Versi Standard",
      link: "/",
    },
    {
      name: "Versi Pro",
      link: "/pro",
    },
  ];

  const commonQuestions = ["Cara Memasak Air", "Cerita lelucon", "Membuat Website Pemula", "Tutorial Belajar Pyhton"];
  return (
    <div className="main-container">
      <div className="history-icon flex lg:hidden md:hidden ml-2 -mt-2" onClick={toggleHistory}>
        📑
      </div>
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
      <div className="chat-container">
        <div className="header">
          <div className="title-container -translate-y-8 lg:translate-y-0 mx-auto lg:mx-0 md:mx-0" onClick={toggleDropdown}>
            <h1 className="title">SHD.AI</h1>
            <span className="dropdown-icon">▼</span>
          </div>
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
          {showInitialMessage && (
            <div className="initial-message">
              <h2 className="hello-text">Hello.</h2>
              <p className="help-text">How can I help you today?</p>
              <div className="common-questions">
                {commonQuestions.map((question, index) => (
                  <div key={index} className="question-card" onClick={() => handleSubmit(question)}>
                    {question}
                  </div>
                ))}
              </div>
            </div>
          )}
          {output && <div className="output" dangerouslySetInnerHTML={{ __html: output }}></div>}
          {output && !isGenerating && (
            <div className="icon-container mt-4 flex gap-4">
              <button id="like-button" className={`like-button lg:bottom-[95px] lg:right-[110px] md:bottom-[90px] md:right-[110px] bottom-40 right-32 ${isLiked ? "liked" : ""}`} onClick={handleLike}>
                {isLiked ? <FaThumbsUp color="blue" /> : <FaRegThumbsUp />}
              </button>

              <button id="copy-button" className="copy-button lg:bottom-[95px] lg:right-[30px] md:bottom-[90px] md:right-[30px] bottom-40 right-8" onClick={handleCopy}>
                {isCopied ? <FaCheck color="green" /> : <FaCopy />}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="form mb-16 lg:mb-0 md:mb-0">
          <div className="prompt-box">
            <textarea
              name="prompt"
              className="prompt-input"
              placeholder="Masukkan Perintah anda"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              rows="1"
              style={{ resize: "none", overflow: "auto", maxHeight: "6em" }}
            />
            <button type="submit" className="submit-button">
              ▶
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Standard;
