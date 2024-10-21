import { Dispatch, SetStateAction, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setTipoDocumento } from "@nucleo/redux/slices/informacionSlice";

interface DocumentList{
  id: number;
  label: string;
  value: string;
}

interface Props {
  tipoDocumento: string;
  documentList: DocumentList[];
  continuarBoton: boolean;
  setContinuarBoton: Dispatch<SetStateAction<boolean>>;
}

export const DocumentSelector: React.FC<Props> = ({
  tipoDocumento,
  documentList,
  continuarBoton,
  setContinuarBoton,
}) => {

  const dispatch = useDispatch()

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
    dispatch(setTipoDocumento({tipoDocumento: valor}))
  };

  return (
    <div className="flex flex-col">
      <p className="text-left text-slate-800  sm:text-2xl text-lg font-semibold mb-0">
        Seleccione un documento para la verificación
      </p>
      <div className="mb-1 mt-2">

      {documentList.map((opcion) => (
        <label className="my-1 flex gap-1 hover:cursor-pointer" key={opcion.id}>
          {tipoDocumento.length >= 1 && opcion.value === tipoDocumento ? (
            <input
            type="radio"
              name="tipo_documento"
              value={opcion.value}
              onChange={onChange}
              className=" text-slate-800 font-semibold "
              checked
              />
            ) : (
              <input
              type="radio"
              name="tipo_documento"
              value={opcion.value}
              onChange={onChange}
              className=" text-slate-800 font-semibold"
              />
            )}
          {opcion.label}
        </label>
      ))}
      </div>
    </div>
  );
};
