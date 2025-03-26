export const useMobile = () => {
  const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}

export const useAndroid = () => {
  const regex = /Android/i;
  return regex.test(navigator.userAgent);
}

export const useIos = () => {
  const regex = /iPhone|iPad|iPod/i;
  return regex.test(navigator.userAgent);
}