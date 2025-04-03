export const useMobile = () => {
  const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}

export const useSafari = () => {
  const userAgentString = navigator.userAgent.toUpperCase()
  
  const chromeAgent = userAgentString.indexOf("CHROME") > -1; 
  const safariAgent = userAgentString.indexOf("SAFARI") > -1; 
  return (chromeAgent) && (safariAgent) ? false :  true
}

export const useChrome = () => {

  const userAgentString = navigator.userAgent.toUpperCase()
  
  const chromeAgent = userAgentString.indexOf("CHROME") > -1; 
  const  safariAgent = userAgentString.indexOf("SAFARI") > -1; 
  return (chromeAgent) && (safariAgent) ? true : false
}

export const useAndroid = () => {
  const regex = /Android/i;
  return regex.test(navigator.userAgent);
}

export const useIos = () => {
  const regex = /iPhone|iPad|iPod/i;
  return regex.test(navigator.userAgent);
}