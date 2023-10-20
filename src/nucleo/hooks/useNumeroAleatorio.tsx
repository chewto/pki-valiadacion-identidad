export const useNumeroAleatorio = (
  iterador: number,
  min: number,
  max: number
): Set<number> => {
  let numeros: number[] = [];

  for (let index = 0; index < iterador; index++) {
    const numero = Math.floor(Math.random() * (max - min + 1)) + min;
    numeros.push(numero);
  }

  numeros = numeros.sort();

  const numeroSinRepetir = new Set(numeros);

  return numeroSinRepetir;
};
