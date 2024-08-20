

interface Props {
  baseURL: string;
  documentType: string;
}

export const Validate: React.FC<Props> = ({ baseURL, documentType }) => {

  const url = `${baseURL}?document=${documentType}`

  console.log(url)

  return (
    <>
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <iframe
          src={url}
          allow="camera; microphone; geolocation"
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        ></iframe>
      </section>
    </>
  );
};
