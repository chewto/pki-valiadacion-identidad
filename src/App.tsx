import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./paginas/validacion-identidad";
import { EKYCValidation } from "./paginas/ekyc-validation";

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
          <Route path="/ekyc" element={<EKYCValidation/>}/>
            {/* <Route path="ekyc-efirma" element={<ValidacionIdentidad/>}/>

          </Route> */}
        </Routes>
      </Router>

      <h1>Test router</h1>
    </>
  );
}

export default App;
