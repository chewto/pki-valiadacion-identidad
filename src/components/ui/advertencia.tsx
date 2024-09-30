import '../../styles/modal-style.component.css'

interface Props{
  titulo: string;
  contenido: string;
  elemento: JSX.Element;
}

export const Advertencia:React.FC<Props> = ({titulo, contenido, elemento}) => {
  return (
    <div className="modal-container">
      <div className='modal-content'>
        <h1>{titulo}</h1>
        <p>{contenido}</p>
        {elemento}
      </div>
    </div>
  )
}