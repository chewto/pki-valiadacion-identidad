import '@styles/modal-style.component.css'

interface Props{
  titulo: string;
  contenido: string;
  elemento: JSX.Element;
}

export const Advertencia:React.FC<Props> = ({titulo, contenido, elemento}) => {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className='bg-white rounded-lg px-3 py-2 text-center shadow-lg flex flex-col items-center xsm:mx-2'>
        <h1 className='font-bold text-2xl'>{titulo}</h1>
        <p className='font-bold '>{contenido}</p>
        {elemento}
      </div>
    </div>
  )
}