import { createBrowserRouter } from "react-router-dom";
import { ValidacionIdentidad } from "../../paginas/validacion-identidad";

export const router = createBrowserRouter([
  {
    path: "",
    element: <ValidacionIdentidad />,
  },
]);
