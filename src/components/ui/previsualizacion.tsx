
interface Props{
  preview: string;
  nombrePreview: string;
}

export const Previsualizacion: React.FC<Props> = ({preview, nombrePreview}) => {
  return (
    <div className="flex justify-center my-2">
      <img src={preview} alt={nombrePreview} className="rounded-md xsm:w-5/6 md:w-4/6"/>
    </div>
  );
};
