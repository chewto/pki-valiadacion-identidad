import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./layouts/validacion-identidad";
import EKYCLleida from "@layouts/ekyc-lleida";
// import Test  from "./test";
import TestSdk from "@pages/ekyc-lleida/test-cdn";

function App() {
  return (
    <>
      {/* <BrowserRouter>
        <Routes>
          <Route path="validacion">
            <Route path="ekyc-efirma" element={<ValidacionIdentidad />}/>
            <Route path="ekyc" element={<EKYCValidation/>}/>
          </Route>
        </Routes>
      </BrowserRouter> */}

      <Router>
        <Routes>
          <Route path="/ekyc-efirma" element={<ValidacionIdentidad/>}/>
          <Route path="/ekyc" element={<EKYCLleida/>}/>

          <Route path="/test" element={<TestSdk/>}/>
            {/* <Route path="ekyc-efirma" element={<ValidacionIdentidad/>}/>

          </Route> */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
