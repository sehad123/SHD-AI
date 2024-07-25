import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MarkdownIt from "markdown-it";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import "../App.css";

const API_KEY = "AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ";

function Standard() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [chat, setChat] = useState(null);

  useEffect(() => {
    const initializeChat = async () => {
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

      const newChat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 100,
        },
      });

      setChat(newChat);
    };

    initializeChat();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOutput("Generating...");
    window.scrollTo(0, 0);

    try {
      const promptValue = prompt;
      setPrompt("");

      const result = await chat.sendMessageStream(promptValue);

      const buffer = [];
      const md = new MarkdownIt();
      for await (const response of result.stream) {
        buffer.push(response.text());
        setOutput(md.render(buffer.join("")));
      }

      const historyItem = {
        id: history.length,
        prompt: promptValue,
        output: buffer.join(""),
      };

      setHistory([...history, historyItem]);
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    }
  };

  const handleHistoryClick = (item) => {
    setOutput(item.output);
    setHistoryVisible(false); // Menyembunyikan history container pada tampilan mobile
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      alert("Output copied to clipboard");
    });
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const toggleHistory = () => {
    setHistoryVisible(!historyVisible);
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

  return (
    <div>
      <div className="main-container">
        {/* Icon history untuk tampilan mobile */}
        <div className="history-icon flex lg:hidden md:hidden ml-2 -mt-2" onClick={toggleHistory}>
          📑
        </div>
        {/* History container */}
        <div className={`history-container ${historyVisible ? "full-screen" : ""} ${historyVisible ? "block" : "hidden"} lg:block md:block`}>
          {/* Icon close untuk tampilan mobile */}
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
          <div className="output-container -mt-10 lg:mt-0 border border-white lg:border-gray-200 md:border-gray-200">
            {output && <div className="output" dangerouslySetInnerHTML={{ __html: output }}></div>}
            {output && (
              <button id="copy-button" className="copy-button" onClick={handleCopy}>
                🧾
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="form mb-16 lg:mb-0 md:mb-0">
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

export default Standard;
