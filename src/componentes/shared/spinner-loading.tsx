import { Spinner } from 'reactstrap'
import '../../styles/spinner-loading.component.css'

export const SpinnerLoading:React.FC = () => {
  return (
    <div className='loader-container'>
      <div className='loader-content'>
        <span>Cargando informacion</span>
        <Spinner color="primary"/>
      </div>
    </div>
  )
}