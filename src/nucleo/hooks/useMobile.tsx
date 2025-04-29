import { UAParser } from 'ua-parser-js';



export const useMobile = () => {
  const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}
// var osName = result.os.name || "Desconocido";

const parser = new UAParser();
const result = parser.getResult();

function getBrowser() {
  let browserName = result.browser.name || "DESCONOCIDO";
  browserName = browserName.toUpperCase()
  return browserName
}

function getOs(){
  let osName = result.os.name || "DESCONOCIDO";
  osName = osName.toUpperCase()
  return osName
}

export const useDetectBrowser = (browser:string) => {

  const testBrowser = browser.toUpperCase()

  const detectedBrowser = getBrowser()

  return detectedBrowser === testBrowser || detectedBrowser.includes(testBrowser) ? true : false
}
export const useDetectOs = (Os:string) => {
  
  const testOs = Os.toUpperCase()
  
  const detectedOs = getOs()

  return detectedOs === testOs || detectedOs.includes(testOs)  ? true : false
}