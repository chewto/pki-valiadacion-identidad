import Card from "@components/ui/card";
import { URLS } from "@nucleo/api-urls/urls";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spinner } from "reactstrap";

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const idUser = params.get("id");
  const key = params.get("key");
  const redirect = params.get('redirect')

  const [loading, setLoading] = useState<boolean>(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<boolean>(false);

  const authKeyUrl = `${URLS.getUserData}?id=${idUser}&key=${key}`;

  useEffect(() => {
    axios
      .post(authKeyUrl)
      .then((res) => setValid(res.data.isValid))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (valid) {

      localStorage.setItem('redirect', redirect ?? '')

      navigate(`/ekyc/validation?id=${idUser}&tipo=1&stand=0`)
    }
  }, [valid, setValid]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex md:items-center md:mt-0 xsm:items-start  justify-center  xsm:px-1 md:pt-0 xsm:pt-5">
      <Card isBlocked={false}>
        <div className="flex justify-center items-center">
          {loading && (
            <div className="flex justify-center items-center flex-col gap-2">
              <div className="text-xl">cargando</div>
              <Spinner color="primary" />
            </div>
          )}
          {error && (
            <div className="flex justify-center items-center flex-col gap-2 animate-fadeIn">
            <span className="text-xl font-semibold">Ha ocurrido un error</span>
            <div className="bg-red-600 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="70px"
                viewBox="0 -960 960 960"
                width="70px"
                fill="#e8eaed"
              >
                <path d="M479.99-280q15.01 0 25.18-10.15 10.16-10.16 10.16-25.17 0-15.01-10.15-25.18-10.16-10.17-25.17-10.17-15.01 0-25.18 10.16-10.16 10.15-10.16 25.17 0 15.01 10.15 25.17Q464.98-280 479.99-280Zm-31.32-155.33h66.66V-684h-66.66v248.67ZM480.18-80q-82.83 0-155.67-31.5-72.84-31.5-127.18-85.83Q143-251.67 111.5-324.56T80-480.33q0-82.88 31.5-155.78Q143-709 197.33-763q54.34-54 127.23-85.5T480.33-880q82.88 0 155.78 31.5Q709-817 763-763t85.5 127Q880-563 880-480.18q0 82.83-31.5 155.67Q817-251.67 763-197.46q-54 54.21-127 85.84Q563-80 480.18-80Zm.15-66.67q139 0 236-97.33t97-236.33q0-139-96.87-236-96.88-97-236.46-97-138.67 0-236 96.87-97.33 96.88-97.33 236.46 0 138.67 97.33 236 97.33 97.33 236.33 97.33ZM480-480Z" />
              </svg>
            </div>
          </div>
          )}

          {valid && (
            <div className="flex justify-center items-center flex-col gap-2 animate-fadeIn">
              <span className="text-xl font-semibold">valido</span>
              <div className="bg-green-600 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="70px"
                  viewBox="0 -960 960 960"
                  width="70px"
                  fill="#e8eaed"
                >
                  <path d="M422-297.33 704.67-580l-49.34-48.67L422-395.33l-118-118-48.67 48.66L422-297.33ZM480-80q-82.33 0-155.33-31.5-73-31.5-127.34-85.83Q143-251.67 111.5-324.67T80-480q0-83 31.5-156t85.83-127q54.34-54 127.34-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82.33-31.5 155.33-31.5 73-85.5 127.34Q709-143 636-111.5T480-80Zm0-66.67q139.33 0 236.33-97.33t97-236q0-139.33-97-236.33t-236.33-97q-138.67 0-236 97-97.33 97-97.33 236.33 0 138.67 97.33 236 97.33 97.33 236 97.33ZM480-480Z" />
                </svg>
              </div>
            </div>
          )}
          {valid != null && !valid && (
            <div className="flex justify-center items-center flex-col gap-2 animate-fadeIn">
              <span className="text-xl font-semibold">Token invalido</span>
              <div className="bg-red-600 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="70px"
                  viewBox="0 -960 960 960"
                  width="70px"
                  fill="#e8eaed"
                >
                  <path d="M479.99-280q15.01 0 25.18-10.15 10.16-10.16 10.16-25.17 0-15.01-10.15-25.18-10.16-10.17-25.17-10.17-15.01 0-25.18 10.16-10.16 10.15-10.16 25.17 0 15.01 10.15 25.17Q464.98-280 479.99-280Zm-31.32-155.33h66.66V-684h-66.66v248.67ZM480.18-80q-82.83 0-155.67-31.5-72.84-31.5-127.18-85.83Q143-251.67 111.5-324.56T80-480.33q0-82.88 31.5-155.78Q143-709 197.33-763q54.34-54 127.23-85.5T480.33-880q82.88 0 155.78 31.5Q709-817 763-763t85.5 127Q880-563 880-480.18q0 82.83-31.5 155.67Q817-251.67 763-197.46q-54 54.21-127 85.84Q563-80 480.18-80Zm.15-66.67q139 0 236-97.33t97-236.33q0-139-96.87-236-96.88-97-236.46-97-138.67 0-236 96.87-97.33 96.88-97.33 236.46 0 138.67 97.33 236 97.33 97.33 236.33 97.33ZM480-480Z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
