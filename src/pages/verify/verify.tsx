import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as CryptoJS from "crypto-js";
import SpinnerLoading from "@components/ui/spinner-loading";

export default function Verify() {
  const { payload } = useParams();

  const formRef = useRef<HTMLFormElement>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string>("");

  const secretKey = "test";

  useEffect(() => {
    try {
      if (payload) {
        const bytes = CryptoJS.AES.decrypt(payload, secretKey);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        setDecryptedUrl(decryptedStr);
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    // Autoenvía el formulario en cuanto se monte el componente
    if (decryptedUrl && formRef.current) {
      formRef.current.submit();
    }
  }, [decryptedUrl]);

  return (
    <>
    <div className="flex justify-center items-center h-dvh w-dvw">
        <SpinnerLoading message="Redireccionando" styles="" id=""/>
    </div>
      <div style={{ display: "none" }}>
        <form
          ref={formRef}
          action="https://desarrollo.e-custodia.com/verificar_dispositivo.php"
          method="POST"
        >
          <input type="hidden" name="rutavalidacion" value={decryptedUrl} />
        </form>
      </div>
    </>
  );
}
