import { useState } from 'react';

export default function CameraInput(){
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH * height) / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setImageSrc(dataUrl);
        }
        URL.revokeObjectURL(objectUrl);
        canvas.width = 0;
        canvas.height = 0;
        img.src = "";
      };
      img.src = objectUrl;
    }
  };

  return (
    <div >
      <label className='bg-blue-700 px-3 py-2 mx-2 my-3 clickable-label'>
        <span className='text-white'>Presione para tomar foto</span>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleCapture} 
        className='absolute opacity-0 pointer-events-none'
        style={{ width: '1px', height: '1px' }}
      />
      </label>

      <div>{imageSrc && <img src={imageSrc} alt="Captured" className='w-2/4'/>}</div>
    </div>
  );
}
