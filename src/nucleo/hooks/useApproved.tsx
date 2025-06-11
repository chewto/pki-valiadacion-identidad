import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as CryptoJS from 'crypto-js';

export const useApproved = () => {

  const navigate = useNavigate();

  const [params] = useSearchParams();
  const approvedParam = params.get("aprobado")?.toLocaleLowerCase();

  const secretKey = "test";

  // const navigate = useNavigate();

  useEffect(() => {
    if (approvedParam == null || approvedParam !== "positivo") {
      const currentUrl = `${window.location.href}&aprobado=positivo`;

      // Encrypt the current URL
      const encryptedData = CryptoJS.AES.encrypt(
        currentUrl,
        secretKey
      ).toString();

      // Build the URL that points to the Verify component route
      // const newUrl = `${
      //   window.location.origin
      // }/validacion/#/verify/${encodeURIComponent(encryptedData)}`;

      const newUrl = `/verify/${encodeURIComponent(encryptedData)}`


      navigate(newUrl);
    }
  }, []);
};
