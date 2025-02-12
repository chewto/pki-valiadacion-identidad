import { useState } from 'react';

export default function CameraInput(){
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div >
      <label className='bg-blue-700 px-3 py-2 mx-2 my-3'>
        <span className='text-white'>Presione para tomar foto</span>
      <input type="file" accept="image/*" capture="environment" onChange={handleCapture} className='hidden'/>
      </label>

      <div>{imageSrc && <img src={imageSrc} alt="Captured" className='w-2/4'/>}</div>
    </div>
  );
}
