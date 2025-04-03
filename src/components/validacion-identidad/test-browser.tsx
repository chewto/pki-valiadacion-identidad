import { useAndroid, useChrome, useIos, useSafari } from "@nucleo/hooks/useMobile";
import { useEffect } from "react";

export default function TestBrowser() {
  const isAndroid = useAndroid();
  const isIos = useIos();
  const isChrome = useChrome()
  const isSafari = useSafari()

  console.log(navigator.userAgent)

  useEffect(() => {
    console.log(isAndroid, isIos);

    console.log(isChrome)
    console.log(isSafari)
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
          {isIos && (
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
