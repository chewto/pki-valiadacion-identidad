
interface Props{
  preview: string;
  nombrePreview: string;
}

export const Previsualizacion: React.FC<Props> = ({preview, nombrePreview}) => {
  return (
    <div className="img-container">
      <img src={preview} alt={nombrePreview} />
    </div>
  );
};
