import { RouterProvider } from 'react-router-dom';
import {router} from './nucleo/rutas/rutas'

export const App:React.FC = () => {
  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}