export const useHour = () => {
  const fechaActual = new Date();
  let horaActual = `${fechaActual.getHours()}`;
  horaActual = horaActual.length <= 1 ? `0${horaActual}` : horaActual
  let minutos = `${fechaActual.getMinutes()}`;
  minutos = minutos.length <=1 ? `0${minutos}`: minutos
  const horaCompleta = `${horaActual}:${minutos}`;

  return horaCompleta
}