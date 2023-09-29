import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ValidacionIdentidad } from "./paginas/validacion-identidad";

function App() {


  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/validacion/:idFirma" element={<ValidacionIdentidad />}/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
