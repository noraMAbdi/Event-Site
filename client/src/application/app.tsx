import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "../components/pages/HomePage.jsx";
import OrganizerSite from "../components/pages/OrganizerSite.jsx";
// @ts-ignore
import {
  EntraCallback,
  GoogleCallback,
  LogInPage,
  RegisteredUser,
} from "../components/pages/RegisterUser.jsx";
export const App: React.FC = () => {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LogInPage />} />
          <Route path="/login/google/callback" element={<GoogleCallback />} />
          <Route path="/login/entra/callback" element={<EntraCallback />} />
          <Route path="/registereduser" element={<RegisteredUser />} />
          <Route path="/organizer" element={<OrganizerSite />} />
        </Routes>
      </main>
    </Router>
  );
};
