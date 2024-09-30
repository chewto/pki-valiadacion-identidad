interface Props {
  tipo: string | null;
  paso: number;
}

export const PasosEnumerados: React.FC<Props> = ({ tipo, paso }) => {
  const pasosTipo1 = [1, 2, 3, 4, 5];
  const pasosTipo2 = [4, 5, 6, 7, 8];

  

  return (
    <div className="flex sm:justify-evenly xsm:justify-between my-4 ">

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
                <div key={index} className="bg-green-500 text-white py-1 px-2 rounded-2xl font-bold text-xs">
                  ✓
                </div>
              ) : (
                <div
                  key={index}
                  // style={{ opacity: paso + 4 === index ? '1' : '.7' }}
                  className="bg-blue-500 text-white py-1 px-2  rounded-2xl font-bold text-xs"
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
