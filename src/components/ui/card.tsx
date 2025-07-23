import '@styles/card.css'

interface Props{
  children: JSX.Element[] | JSX.Element;
}

export default function Card({children}:Props) {
  return (
    <section className=" bg-white xsm:rounded-lg md:rounded-2xl  shadow-xl xsm:px-3 xsm:py-2 max-w-xl lg:max-w-2xl w-full mt-2 xsm:mx-1">{children}</section>
  );
}
