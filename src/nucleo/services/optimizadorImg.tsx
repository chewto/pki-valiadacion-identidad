export const getImageSizeFromDataURL = (dataURL:any) => {
  const base64Data = dataURL.split(',')[1]; // Extract the base64-encoded image data
  const padding = (base64Data.length % 4 === 0) ? 0 : (4 - base64Data.length % 4); // Calculate padding characters
  const dataSize = (base64Data.length / 4) * 3 - padding; // Calculate the size in bytes
  return dataSize;
};
