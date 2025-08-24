import TableQRCode from "../components/TableQRCode";

export default function TableQRCodes() {
  const tables = Array.from({ length: 20 }, (_, i) => i + 1); // 20 tables

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">QR Codes for Tables</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {tables.map((num) => (
          <TableQRCode key={num} tableNumber={num} />
        ))}
      </div>
    </div>
  );
}
