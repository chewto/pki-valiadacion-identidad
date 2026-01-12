import { useSpeedTest } from "@nucleo/hooks/useSpeedtest";

const NetworkDashboard = () => {
  const { runFullTest, loadingSpeed, results } = useSpeedTest();

  return (
    <div className="p-6 bg-gray-100 rounded-xl">
      <button 
        onClick={runFullTest} 
        disabled={loadingSpeed}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loadingSpeed ? 'Analizando red...' : 'Iniciar Test Completo'}
      </button>

      {results && (
        <div>
          
        </div>
        // <div className="grid grid-cols-2 gap-4 mt-4">
        //   <div className="p-4 bg-white shadow rounded">
        //     <p className="text-sm text-gray-500">Descarga</p>
        //     <p className="text-2xl font-bold">{results.downloadMbps} Mbps</p>
        //   </div>
        //   <div className="p-4 bg-white shadow rounded">
        //     <p className="text-sm text-gray-500">Subida</p>
        //     <p className="text-2xl font-bold">{results.uploadMbps} Mbps</p>
        //   </div>
        // </div>
      )}
    </div>
  );
};

export default NetworkDashboard;