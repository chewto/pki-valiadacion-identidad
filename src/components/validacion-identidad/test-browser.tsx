import { useDetectBrowser, useDetectOs } from "@nucleo/hooks/useMobile";
import { useEffect } from "react";

export default function TestBrowser() {

  const isIOS = useDetectOs("IOS");
  const isSafari = useDetectBrowser("MOBILE SAFARI");
  const isAndroid = useDetectOs("ANDROID");
  const isChrome = useDetectBrowser("CHROME");

  useEffect(() => {
    console.log(isSafari, isIOS);
    console.log(isChrome, isAndroid);
  }, []);

  return (
    <div>
      <h3>Test iphone y android</h3>
      <div>
        <h4>Test</h4>
        <div>
          {isAndroid && (
            <div>
              <h5>Deteccion en Android</h5>
              <ul>
                {isChrome && <li>estas usando chrome</li>}
                {isSafari && <li>estas usando safari</li>}
              </ul>
            </div>
          )}
          {isIOS && (
            <div>
              <h5>Deteccion en Iphone</h5>
              <ul>
                {isChrome && <li>estas usando chrome</li>}
                {isSafari && <li>estas usando safari</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
