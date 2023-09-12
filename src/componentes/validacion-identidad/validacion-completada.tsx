import {useEffect, useState} from 'react'
import { formdataKeys } from '../../nucleo/validadores/validacion-identidad/validador-formdata'


export const ValidacionCompletada:React.FC = () => {

  const [res, setRes] = useState()

  useEffect(()=>{
    fetch('http://localhost:5000/usuario').then(res => res.json()).then(res => console.log(res))
  },[])

  return(
    <>
      <main>
        verificacion enviada
        <span>{res}</span>
      </main>
    </>
  )
}