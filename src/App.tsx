import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./paginas/validacion-identidad";
import { EKYCValidation } from "./paginas/ekyc-validation";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="validacion">
            <Route path="ekyc-efirma" element={<ValidacionIdentidad />}/>
            <Route path="ekyc" element={<EKYCValidation/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
