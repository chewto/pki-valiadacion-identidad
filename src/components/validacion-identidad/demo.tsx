import { RootState } from "@nucleo/redux/store"
import { useEffect } from "react"
import { useSelector } from "react-redux"

interface Props {
  side: string;
  handleNext: () => void;
}

export default function Demo({ side, handleNext }: Props) {

  const informacion = useSelector((state:RootState) => state.informacion)

  useEffect(() => {
    console.log(side)
  }, [informacion])

  const svgPath = side === 'face' ?  `/svg/${side}.svg` : `/svg/${side}_${informacion.tipoDocumento.replace(/\s+/g, '_').toLowerCase()}.svg`;
  // return (<div>demo funcionando {side} {informacion.tipoDocumento}</div>)


return (
  <div className="border-2 border-red-600 flex items-center justify-center"  onClick={() => {handleNext(); console.log("demo click")}}>
    demo funcionando {svgPath} 
    <img className="w-7/12" src={svgPath} alt={`SVG for ${side}`} />
  </div>
);}