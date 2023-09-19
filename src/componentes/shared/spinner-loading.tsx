import { Spinner } from 'reactstrap'
import '../../styles/spinner-loading.component.css'

export const SpinnerLoading = () => {
  return (
    <div className='loader-container'>
      <div className='loader-content'>
        <span>Cargando informacion</span>
        <Spinner color="primary"/>
      </div>
    </div>
  )
}