import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "@layouts/validacion-identidad";
import EKYCLleida from "@layouts/ekyc-lleida";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/ekyc-efirma"
          element={<ValidacionIdentidad standalone={false} />}
        />
        <Route path="/ekyc-lleida" element={<EKYCLleida />} />
        <Route path="/ekyc">
          <Route
            path="validation/:hash"
            element={<ValidacionIdentidad standalone={true} />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
