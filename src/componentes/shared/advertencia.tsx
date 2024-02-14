import '../../styles/modal-style.component.css'

interface Props{
  titulo: string;
  contenido: string
}

export const Advertencia:React.FC<Props> = ({titulo, contenido}) => {
  return (
    <div className="modal-container">
      <div className='modal-content'>
        <h1>{titulo}</h1>
        <p>{contenido}</p>
      </div>
    </div>
  )
}