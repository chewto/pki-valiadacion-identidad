interface Props{
  children: JSX.Element[];
}

export default function Card({children}:Props) {
  return (
    <section className="bg-white rounded-2xl  shadow-xl xsm:px-3 xsm:py-3 sm:px-4 sm:py-4 max-w-md w-full">{children}</section>
  );
}
