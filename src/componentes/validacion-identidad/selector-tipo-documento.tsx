import { Dispatch, SetStateAction, useEffect } from "react";
import "../../styles/selector.component.css";

interface Props {
  tipoDocumento: string;
  setTipoDocumento: Dispatch<SetStateAction<string>>;
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
}

export const SelectorTipoDocumento: React.FC<Props> = ({
  tipoDocumento,
  setTipoDocumento,
  continuarBoton,
  setContinuarBoton,
}) => {

  useEffect(()=> {
    if(continuarBoton === true){
      setContinuarBoton(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(() => {
    if (tipoDocumento.length >= 1) {
      setContinuarBoton(true);
    }
  }, [tipoDocumento.length, setContinuarBoton]);

  const onChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const valor = evento.target.value;
    setTipoDocumento(valor);
  };

  const tiposDocumentos = [
    {
      id: 0,
      valor: "Cédula de ciudadanía",
    },
    {
      id: 1,
      valor: "Cédula de extranjería",
    },
    {
      id: 2,
      valor: "Permiso por protección temporal",
    },
    {
      id: 3,
      valor: "Tarjeta de identidad",
    },
  ];

  return (
    <div className="selector-container">
      <p className="selector-texto">
        Seleccione un documento para la verificación
      </p>
      {tiposDocumentos.map((opcion) => (
        <label className="selector-btn" key={opcion.id}>
          {tipoDocumento.length >= 1 && opcion.valor === tipoDocumento ? (
            <input
              type="radio"
              name="tipo_documento"
              value={opcion.valor}
              key={opcion.id}
              onChange={onChange}
              className="selector-radio"
              checked
            />
          ) : (
            <input
              type="radio"
              name="tipo_documento"
              value={opcion.valor}
              key={opcion.id}
              onChange={onChange}
              className="selector-radio"
            />
          )}
          {opcion.valor}
        </label>
      ))}
    </div>
  );
};
