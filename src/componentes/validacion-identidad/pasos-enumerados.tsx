// import { useEffect } from "react";

interface Props {
  tipo: string | null;
  paso: number;
  progreso: number;
}

export const PasosEnumerados: React.FC<Props> = ({ tipo, paso, progreso }) => {
  const pasosTipo1 = [1, 2, 3, 4, 5];
  const pasosTipo2 = [4, 5, 6, 7, 8];

  return (
    <div className="step-number-container">
      <div className="stepper-progress-bar">
        <div className="progress-bar" style={{width: `${progreso}%`}}></div>
      </div>
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
                  // style={{ opacity: paso + 4 === index ? '1' : '.7' }}
                  className="step"
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
