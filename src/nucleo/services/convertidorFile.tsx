export const convertidorFile = async (dataURL: string | undefined, nombreArchivo: string) => {
    try {
      if (dataURL) {
        const response = await fetch(dataURL);
        const blob = await response.blob();
        const archivo = new File([blob], nombreArchivo, { type: blob.type });
        return archivo;
      }
    } catch (error) {
      console.log(error);
    }
}