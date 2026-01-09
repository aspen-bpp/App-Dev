import React, { useState, useEffect } from 'react';
import LoginPage from "./pages/Login";
import DataPage from "./pages/DataPage";
import { BrowserRouter as Router, Route, Routes} from "react-router-dom";


function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage/>}></Route>
        <Route path="/Data" element={<DataPage/>}></Route>
      </Routes>
    </Router>
  )
}
export default App;