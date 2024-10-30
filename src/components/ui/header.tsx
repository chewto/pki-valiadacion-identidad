import logo from '../../assets/img/logo-honducert.png'

interface Props{
  titulo: string;
}

export const Header:React.FC<Props> = ({titulo}) => {
  return(
    <header className='w-full flex flex-col items-center'>
      <img src={logo} alt="logo e-custodia" className='xsm:w-5/12'/>
      <h2 className=" text-blue-600 text-center font-bold xsm:text-lg mb-0">{titulo}</h2>
    </header>
  )
}