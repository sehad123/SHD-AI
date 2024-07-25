import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Pro from "./pages/Pro";
import Standard from "./pages/Standard";

const App = () => {
  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in-sine",
      delay: 100,
    });
    AOS.refresh();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Standard />} />
        <Route path="pro" element={<Pro />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
