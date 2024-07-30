import { Dispatch, SetStateAction, useState } from "react";
import "../../styles/selector.component.css";

interface Props {
  setDocumentType: Dispatch<SetStateAction<string>>;
}

export const Selector: React.FC<Props> = ({ setDocumentType }) => {
  const [selected, setSelected] = useState<string>("");

  const documentTypes = [
    {
      value: "PHOTO_ID",
      label: "Documento de identidad",
    },
    {
      value: "PASSPORT",
      label: "Pasaporte",
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setDocumentType(value);
    setSelected(value);
  };

  return (
    <article className="selector-container">
      <p className="selector-texto">
        Seleccione su tipo de documento para la validacion
      </p>
      {documentTypes.map((value, index) => (
        <label key={index} className="selector-btn">
          {selected == value.value ? (
            <input type="radio" value={value.value} checked className="selector-radio"/>
          ) : (
            <input
              type="radio"
              value={value.value}
              onChange={handleChange}
              className="selector-radio"
            />
          )}
          {value.label}
        </label>
      ))}
    </article>
  );
};
