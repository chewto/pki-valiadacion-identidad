import { createBrowserRouter } from "react-router-dom";
import { ValidacionIdentidad } from "../../paginas/validacion-identidad";
import { App } from "../../app";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    errorElement: <h1>error</h1>,
    children: [{
      index: true,
      path: "validacion-identidad/:idFirma",
      element: <ValidacionIdentidad/>
    }]
  }
]);
