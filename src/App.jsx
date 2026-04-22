import { useState } from "react";
import Login from "./Pages/Login";
import KanbanBoard from "./Components/KanbanBoard";


export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={(userData) => setUser(userData)} />;
  }

  return <KanbanBoard user={user} onLogout={() => setUser(null)} />;
}

