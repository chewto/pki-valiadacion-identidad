import { Spinner } from 'reactstrap'
import '@styles/spinner-loading.component.css'

interface Props{
  message: string;
  styles: string;
  id: string;
}

export default function SpinnerLoading({message, styles, id}:Props){
  return (
    <div className={`${styles}`} id={id}>
      <div className={`loader-content`}>
        <span>{message}</span>
        <Spinner color="primary"/>
      </div>
    </div>
  )
}