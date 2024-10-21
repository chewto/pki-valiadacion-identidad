interface Props{
  children: JSX.Element[];
}

export default function Card({children}:Props) {
  return (
    <section className="bg-white xsm:rounded-lg md:rounded-2xl  shadow-xl xsm:mx-[2px] xsm:px-3 xsm:py-2 md:px-5 md:py-4  max-w-xl lg:max-w-2xl w-full">{children}</section>
  );
}
