import logoPKI from '../../assets/img/logo-pki.png'

interface Props{
  titulo: string;
}

export const Header:React.FC<Props> = ({titulo}) => {
  return(
    <header>
      <img src={logoPKI} alt="pki" />
      <h2 className="title">{titulo}</h2>
    </header>
  )
}