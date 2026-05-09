import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./component/Landing";
import HostelDashboard from "./component/HostelDashboard";
import WardenDashboard from "./component/WardenDashboard";
import WardenLogin from "./component/WardenLogin";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard/:regNo?" element={<HostelDashboard />} />
        <Route path="/warden" element={<WardenDashboard />} />
        <Route path="/warden/login" element={<WardenLogin />} />
      </Routes>
    </Router>
  );
};

export default App;

