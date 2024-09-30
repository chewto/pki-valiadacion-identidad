interface Props{
  children: JSX.Element[]
}

export default function CardContainer({children}:Props) {
  return <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center xsm:px-1 ">{children}</main>
}