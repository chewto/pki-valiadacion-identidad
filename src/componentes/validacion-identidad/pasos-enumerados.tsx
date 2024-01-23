// import { useEffect } from "react";

interface Props {
  tipo: string | null;
  paso: number;
}

export const PasosEnumerados: React.FC<Props> = ({ tipo, paso }) => {
  const pasosTipo1 = [1, 2, 3, 4, 5];
  const pasosTipo2 = [4, 5, 6, 7, 8];

  // useEffect(() => {
  //   console.log(paso);
  // }, [paso]);

  return (
    <div className="step-number-container">
      {tipo === "1" && (
        <>
          {pasosTipo1.map((index) => (
            <>
              {paso >= index && paso != 0 ? (
                <div key={index} className="step-checked">
                  ✓
                </div>
              ) : (
                <div
                  key={index}
                  style={{ color: paso + 1 === index ? "#fff" : "#000" }}
                >
                  {index}
                </div>
              )}
            </>
          ))}
        </>
      )}

      {tipo === "3" && (
        <>
          {pasosTipo2.map((index) => (
            <>
              {paso + 3 >= index && paso != 0 ? (
                <div key={index} className="step-checked">
                  ✓
                </div>
              ) : (
                <div
                  key={index}
                  style={{ color: paso + 4 === index ? "#fff" : "#000" }}
                >
                  {index}
                </div>
              )}
            </>
          ))}
        </>
      )}
    </div>
  );
};
