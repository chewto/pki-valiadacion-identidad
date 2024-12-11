import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./layouts/validacion-identidad";
import EKYCLleida from "@layouts/ekyc-lleida";
// import VideoEKYC from "@layouts/video-ekyc"

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/ekyc-efirma" element={<ValidacionIdentidad/>}/>
          <Route path="/ekyc" element={<EKYCLleida/>}/>
          {/* <Route path='/test' element={<VideoEKYC/>}/> */}
        </Routes>
      </Router>
  );
}

export default App;
