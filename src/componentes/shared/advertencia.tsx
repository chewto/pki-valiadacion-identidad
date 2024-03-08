import '../../styles/modal-style.component.css'

interface Props{
  titulo: string;
  contenido: string;
  icon: string;
}

export const Advertencia:React.FC<Props> = ({titulo, contenido, icon}) => {
  return (
    <div className="modal-container">
      <div className='modal-content'>
        <h1>{titulo}</h1>
        <p>{contenido}</p>
        <img src={icon} style={{width: '50%'}}/>
      </div>
    </div>
  )
}