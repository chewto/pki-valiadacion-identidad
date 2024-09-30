import SpinnerLoading from "@components/ui/spinner-loading";
import { useEffect, useRef, useState } from "react";

declare const customer: {
  init: (options: any) => void;
};

interface Props {
  documentType: string;
}
export default function Lleida({ documentType }: Props) {
  // const [loading, setLoading] = useState<boolean>(false);

  // const selfieRef = useRef<HTMLButtonElement>(null);

  // useEffect(() => {
  //   const adapter = document.createElement('script');
  //   adapter.setAttribute('src', "https://localhost/lleida/sdk/vendors/js/adapter.js");
  //   document.head.appendChild(adapter);
    
  //   const jquery = document.createElement('script');
  //   jquery.setAttribute('src', "https://localhost/lleida/sdk/vendors/js/jquery.min.js");
  //   document.head.appendChild(jquery);

  //   const lleidaSDK = document.createElement('script');
  //   lleidaSDK.setAttribute('src', "https://localhost/lleida/sdk/js/LleidaSDK.js");
  //   document.head.appendChild(lleidaSDK);

  //   const janus = document.createElement('script');
  //   janus.setAttribute('src', "https://localhost/lleida/sdk/js/janus.js");
  //   document.head.appendChild(janus);

  //   const mediaServer = document.createElement('script');
  //   mediaServer.setAttribute('src', "https://localhost/lleida/sdk/js/mediaserver.js");
  //   document.head.appendChild(mediaServer);

  //   const riuCore = document.createElement('script');
  //   riuCore.setAttribute('src', "https://localhost/lleida/sdk/js/riucore.js");
  //   document.head.appendChild(riuCore);

  //   const riu = document.createElement('script');
  //   riu.setAttribute('src', "https://localhost/lleida/sdk/js/riu.js");
  //   document.head.appendChild(riu);

  //   const validationScript = document.createElement('script');
  //   validationScript.setAttribute('src', "https://localhost/lleida/sdk/scripts/validation.js");
  //   document.head.appendChild(validationScript);
  // }, []);

  const takePhotoBtn =
    "bg-blue-500 text-white hover:bg-blue-600 transition-all px-2 py-1 rounded-lg";

  const photoContainer = "border-3 border-slate-200  rounded-lg py-2 px-2";

  const photo = "bg-slate-200 rounded-lg mt-3 border-1 border-red-500";

  // const [isOpen, setIsOpen] = useState(true);

  // const [selfie, setSelfie] = useState(true);
  // const [front, setFront] = useState(false);
  // const [back, setBack] = useState(false);

  return (
    <article>
      <div className="flex justify-center my-2">
        <button className={takePhotoBtn}>tomar selfie</button>
        {/* necesitas otros dos botones para el frontal y el reverso */}
        <button onClick={() => {initValidation('user_camera', 'user_face','user_document_1', 'user_document_2')}}>iniciar validacion</button>
      </div>

      <div
      className={`xsm:bg-black xsm:bg-opacity-45 fixed inset-0  flex items-center justify-center hidden`}
      >
        <div className="bg-white xsm:p-1.5 md:p-3  rounded-lg shadow-lg">
          <p className="text-center text-lg font-semibold text-slate-800">
            Preview
          </p>

          <div className="flex justify-evenly my-3">
            <button
              onClick={() => {
                // setOpenModal(false);
              }}
              className="border-2 border-slate-200 hover:bg-slate-100 transition-all py-2 px-3 rounded-md flex items-center gap-2"
            >
              repetir foto
              <span className="material-symbols-outlined">sync</span>
            </button>
            <button
              onClick={() => {
                // setOpenModal(false);
              }}
              className="bg-blue-500 hover:bg-blue-600 transition-all font-semibold text-white py-2 px-3 rounded-md flex items-center gap-2"
            >
              continuar
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          <div className="flex flex-wrap justify-center items-center">
            <div
              className={`${photoContainer} hidden`}
            >
              <span className="text-sm font-semibold text-slate-800">
                Foto del usuario
              </span>
              <canvas id="user_face" className="bg-slate-200 rounded-lg mt-3 xsm:w-11/12 mx-auto"></canvas>
            </div>
            <div
              className={`${photoContainer} hidden`}
            >
              <span className="text-sm font-semibold text-slate-800">
                Foto del frontal
              </span>
              <canvas id="user_document_1" className={photo}></canvas>
            </div>
            <div
              className={`${photoContainer} hidden`}
            >
              <span className="text-sm font-semibold text-slate-800">
                Foto del reverso
              </span>
              <canvas id="user_document_2" className={photo}></canvas>
            </div>
          </div>
        </div>
      </div>

      <video id="user_camera" className="bg-black rounded-lg w-full"></video>

      <SpinnerLoading message="cargando"  id="loader" styles="hidden"/>

      {/* <iframe src="https://localhost/ekyc-lleida/" allow="autoplay; camera; microphone"></iframe> */}
    </article>
  );
}
