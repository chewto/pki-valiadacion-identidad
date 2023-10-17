export const useDate = ()=>{
  const fechaActual = new Date();
  const dia = fechaActual.getDate();
  const mes = fechaActual.getMonth() + 1;
  const anho = fechaActual.getFullYear();

  const fechaCompleta = `${dia}/${mes}/${anho}`

  return fechaCompleta;
}