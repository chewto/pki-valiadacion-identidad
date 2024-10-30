import {createRoot} from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { Provider } from 'react-redux';
import {store} from './nucleo/redux/store'

createRoot(document.getElementById('root')!).render(
<Provider store={store}>
  <App/>
</Provider>
)
