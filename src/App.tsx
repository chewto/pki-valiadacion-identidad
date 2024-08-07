import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./paginas/validacion-identidad";
import { EKYCValidation } from "./paginas/ekyc-validation";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/validacion" element={<ValidacionIdentidad />}/>
          <Route path="/eKYC-validation" element={<EKYCValidation/>}/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
