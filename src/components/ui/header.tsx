import logo from '../../assets/img/logo-pki.png'
// import logo from '@assets/img/logo-honducert.png'

interface Props{
  titulo: string;
}

export const Header:React.FC<Props> = ({titulo}) => {
  return(
    <header className='w-full flex flex-col items-center'>
      <img src={logo} alt="logo e-custodia" className='md:w-4/12 xsm:w-3/12'/>
      <h2 className=" text-blue-600 text-center font-bold  md:text-lg xsm:text-sm  mb-0">{titulo}</h2>
    </header>
  )
}