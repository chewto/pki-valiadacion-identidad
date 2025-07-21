import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "@layouts/validacion-identidad";
// import EKYCLleida from "@layouts/ekyc-lleida";
import BarcodeCapture from "@components/validacion-identidad/barcode-capture";
import TestBrowser from "@components/validacion-identidad/test-browser";
import Verify from "@pages/verify/verify";
import Camara from "@pages/camara";

function App() {

  return (
    <Router>
      <Routes>
        <Route
          path="/ekyc-efirma"
          element={<ValidacionIdentidad standalone={false} />}
        />
        <Route
          path="/verify/:payload"
          element={<Verify/>}
        />
        <Route path="/ekyc">
          <Route
            path="validation/:hash"
            element={<ValidacionIdentidad standalone={true} />}
          />
        </Route>
        <Route path="test">
          <Route path="barcode-test" element={<BarcodeCapture/>}/>
          <Route path="deteccion" element={<TestBrowser/>}/>
          <Route path="camara" element={<Camara/>}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
