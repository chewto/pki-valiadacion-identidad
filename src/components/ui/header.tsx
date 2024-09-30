import logo from '../../assets/img/logo-honducert.png'

interface Props{
  titulo: string;
}

export const Header:React.FC<Props> = ({titulo}) => {
  return(
    <header className='w-full flex flex-col items-center mb-1 mt-3'>
      <img src={logo} alt="pki" style={{width: '50%', paddingBottom: '10px'}}/>
      <h2 className=" text-blue-600 text-center">{titulo}</h2>
    </header>
  )
}