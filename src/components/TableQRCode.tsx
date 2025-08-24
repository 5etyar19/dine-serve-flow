import { QRCodeCanvas } from "qrcode.react";

interface TableQRCodeProps {
  tableNumber: number;
}

export default function TableQRCode({ tableNumber }: TableQRCodeProps) {
  const url = `https://smartserve.yourdomain.com/order?table=${tableNumber}`;

  return (
    <div className="flex flex-col items-center border p-4 rounded-lg shadow-md">
      <QRCodeCanvas value={url} size={200} />
      <p className="mt-2 font-semibold">Table {tableNumber}</p>
    </div>
  );
}
