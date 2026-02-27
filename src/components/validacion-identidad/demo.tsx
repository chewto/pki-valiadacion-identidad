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

  // return (<div>demo funcionando {side} {informacion.tipoDocumento}</div>)

  const svgPath = `/svg/${side}.svg`;

return (
  <div onClick={() => {handleNext(); console.log("demo click")}}>
    {/* demo funcionando {side} {informacion.tipoDocumento */}
    <img src={svgPath} alt={`SVG for ${side}`} />
  </div>
);}