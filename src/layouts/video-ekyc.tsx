import Card from "@components/ui/card";
import { Header } from "@components/ui/header";
import FaceCapture from "@pages/video-ekyc/face-capture";

export default function VideoEKYC() {
  // const [step, setStep] = useState<number>(0);

  const steps = [<FaceCapture />];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center xsm:px-1">
      <Card>
        <Header titulo="Validacion de Identidad"></Header>
        <div>{steps[0]}</div>
      </Card>
    </main>
  );
}
