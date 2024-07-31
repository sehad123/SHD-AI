import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MarkdownIt from "markdown-it";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { FaRegThumbsUp, FaThumbsUp, FaCopy, FaCheck, FaUser, FaTrash } from "react-icons/fa";
import axios from "axios";

import "../App.css";

const API_KEY = "AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ";

function Standard() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const [chat, setChat] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5001/profile", {
          headers: { Authorization: token },
        });
        setUsername(response.data.username);
        setEmail(response.data.email);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        navigate("/login");
      }
    };

    const fetchUserHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5001/history", {
          headers: { Authorization: token },
        });
        setHistory(response.data);
      } catch (error) {
        console.error("Error fetching user history:", error);
        navigate("/login");
      }
    };

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

    fetchUserProfile();
    fetchUserHistory();
    initializeChat();
  }, [navigate]);

  const handleSubmit = async (e, question) => {
    if (e) e.preventDefault();
    const currentPrompt = question || prompt;
    setOutput("Generating...");
    setIsGenerating(true);
    setIsLiked(false);
    setShowInitialMessage(false);
    window.scrollTo(0, 0);

    try {
      const value = currentPrompt;
      setPrompt("");

      const result = await chat.sendMessageStream(value);

      const buffer = [];
      const md = new MarkdownIt();
      for await (const response of result.stream) {
        buffer.push(response.text());
        setOutput(md.render(buffer.join("")));
      }

      const now = new Date().toISOString();

      const historyItem = {
        id: history.length,
        prompt: value,
        output: buffer.join(""),
        created_at: now,
      };
      setHistory([...history, historyItem]);

      // Save history to backend
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5001/history", { history: JSON.stringify(historyItem) }, { headers: { Authorization: token } });
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const groupByDate = (historyItems) => {
    return historyItems.reduce((groups, item) => {
      const date = new Date(item.created_at).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});
  };

  const groupedHistory = groupByDate(history);

  const confirmDeleteHistory = (id) => {
    setDeleteItemId(id);
    setConfirmDeleteVisible(true);
  };

  const handleDeleteHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5001/history/${deleteItemId}`, {
        headers: { Authorization: token },
      });
      setHistory(history.filter((item) => item.id !== deleteItemId));
      setConfirmDeleteVisible(false);
      setDeleteItemId(null);
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleHistoryClick = (item) => {
    setOutput(item.output);
    setShowInitialMessage(false);
    setHistoryVisible(false);
  };

  const handleCopy = () => {
    const div = document.createElement("div");
    div.innerHTML = output;
    const text = div.textContent || div.innerText || "";
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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

  const handleProfileClick = () => {
    setProfileDropdownVisible(!profileDropdownVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    } else {
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    }
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

        {Object.keys(groupedHistory).map((date) => (
          <div key={date} className="date-group">
            <h2 className="ml-4 font-bold mt-6">{formatDate(date)}</h2>
            <ul className="history-list">
              {groupedHistory[date].map((item) => (
                <li key={item.id} className="history-item" onClick={() => handleHistoryClick(item)}>
                  <span>{item.prompt}</span>
                  <FaTrash className="delete-icon" onClick={() => confirmDeleteHistory(item.id)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="chat-container">
        <div className="header flex justify-between items-center">
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
          <div className="profile-container relative lg:-mt-10 -mt-16 md:-mt-10">
            <FaUser className="text-xl cursor-pointer" onClick={handleProfileClick} />
            {profileDropdownVisible && (
              <div className="profile-dropdown absolute right-0 mt-2 w-max">
                <div className="p-4">
                  <p>Email: {email}</p>
                  <p>Username: {username}</p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="output-container -mt-10 lg:mt-0 border border-white lg:border-gray-200 md:border-gray-200 dark:border-none dark:lg:border-gray-200 dark:md:border-gray-200">
          {showInitialMessage && (
            <div className="initial-message -mt-0 lg:mt-16">
              <h2 className="hello-text">Hello.</h2>
              <p className="help-text">Welcome to SHD.AI</p>
              <div className="common-questions">
                {commonQuestions.map((question, index) => (
                  <div key={index} className="question-card" onClick={(e) => handleSubmit(e, question)}>
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

        <form onSubmit={(e) => handleSubmit(e, null)} className="form mb-16 lg:mb-0 md:mb-0">
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

        {confirmDeleteVisible && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Konfirmasi Hapus</h3>
              <p>Apakah Anda yakin ingin menghapus item ini?</p>
              <div className="modal-buttons">
                <button onClick={handleDeleteHistory} className="confirm-button">
                  Ya
                </button>
                <button onClick={() => setConfirmDeleteVisible(false)} className="cancel-button">
                  Tidak
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Standard;
