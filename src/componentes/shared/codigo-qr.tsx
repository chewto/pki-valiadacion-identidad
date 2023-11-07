import { useEffect } from "react";
import QRCode from "react-qr-code";

export const CodigoQR: React.FC = () => {
  useEffect(() => {

  }, []);

  return (
    <>
      <QRCode value="hola" />
    </>
  );
};
