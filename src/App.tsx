import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./layouts/validacion-identidad";
import EKYCLleida from "@layouts/ekyc-lleida";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/ekyc-efirma" element={<ValidacionIdentidad/>}/>
          <Route path="/ekyc" element={<EKYCLleida/>}/>
        </Routes>
      </Router>
  );
}

export default App;
