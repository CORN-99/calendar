import { useState } from "react";
import Login from "./Login.jsx";
import CalendarUI from "./CalendarView.jsx";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  return <CalendarUI currentUser={currentUser} />;
}