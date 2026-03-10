import '@styles/modal-style.component.css'

interface Props{
  titulo: string;
  contenido: string;
  elemento: JSX.Element;
}

export const Advertencia:React.FC<Props> = ({titulo, contenido, elemento}) => {
  return (
    <div className="fixed inset-0 pt-2 flex justify-center items-start bg-black bg-opacity-50 z-40">
      <div className='bg-white rounded-lg px-3 py-2 text-center shadow-lg flex flex-col items-center xsm:mx-2  xsm:w-10/12'>
        <h1 className='font-bold text-2xl'>{titulo}</h1>
        <p className='font-bold '>{contenido}</p>
        {elemento}
      </div>
    </div>
  )
}