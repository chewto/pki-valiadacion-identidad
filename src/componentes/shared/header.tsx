import logoPKI from '../../assets/img/logo-pki.png'

export const Header:React.FC = () => {
  return(
    <header>
      <img src={logoPKI} alt="pki" />
      <h2 className="title">Validacion de identidad</h2>
    </header>
  )
}