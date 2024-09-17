import logo from '../../assets/img/logo-honducert.png'

interface Props{
  titulo: string;
}

export const Header:React.FC<Props> = ({titulo}) => {
  return(
    <header>
      <img src={logo} alt="pki" style={{width: '50%', paddingBottom: '10px'}}/>
      <h2 className="title">{titulo}</h2>
    </header>
  )
}