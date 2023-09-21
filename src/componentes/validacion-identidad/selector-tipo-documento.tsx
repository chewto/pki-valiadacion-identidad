import { Dispatch, SetStateAction, useEffect } from "react";
import "../../styles/selector.component.css";

interface Props {
  tipoDocumento: string;
  setTipoDocumento: Dispatch<SetStateAction<string>>;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
}

export const SelectorTipoDocumento: React.FC<Props> = ({
  tipoDocumento,
  setTipoDocumento,
  setContinuarBoton,
}) => {
  useEffect(() => {
    if (tipoDocumento.length >= 1) {
      setContinuarBoton(true);
    }
  }, [tipoDocumento, setContinuarBoton]);

  const onChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const valor = evento.target.value;
    setTipoDocumento(valor);
  };

  const tiposDocumentos = [
    {
      id: 0,
      valor: "Cedula de ciudadania",
    },
    {
      id: 1,
      valor: "Cedula de extranjeria",
    },
    {
      id: 2,
      valor: "Permiso por proteccion temporal",
    },
    {
      id: 3,
      valor: "Tarjeta de identidad",
    },
  ];

  return (
    <div className="selector-container">
      <p className="selector-texto">
        Seleccione un documento para la verificacion
      </p>
      {tiposDocumentos.map((opcion) => (
        <label className="selector-btn">
          {opcion.valor}
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
        </label>
      ))}
    </div>
  );
};
