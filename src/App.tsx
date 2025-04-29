import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "@layouts/validacion-identidad";
// import EKYCLleida from "@layouts/ekyc-lleida";
import BarcodeCapture from "@components/validacion-identidad/barcode-capture";
import TestBrowser from "@components/validacion-identidad/test-browser";
import CameraCanvasComponent from "@components/validacion-identidad/test-camera";

function App() {



  return (
    <Router>
      <Routes>
        <Route
          path="/ekyc-efirma"
          element={<ValidacionIdentidad standalone={false} />}
        />
        {/* <Route path="/ekyc-lleida" element={<EKYCLleida />} /> */}
        <Route path="/ekyc">
          <Route
            path="validation/:hash"
            element={<ValidacionIdentidad standalone={true} />}
          />
        </Route>
        <Route path="test">
          <Route path="barcode-test" element={<BarcodeCapture/>}/>
          <Route path="deteccion" element={<TestBrowser/>}/>
          <Route path="camara" element={<CameraCanvasComponent/>}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
