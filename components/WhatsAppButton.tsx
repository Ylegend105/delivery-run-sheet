function toWaNumber(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

export function WhatsAppButton({
  phoneNumber,
  message,
  label,
}: {
  phoneNumber: string | null | undefined;
  message: string;
  label: string;
}) {
  const digits = phoneNumber ? toWaNumber(phoneNumber) : "";

  if (!digits) {
    return (
      <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-400">
        No WhatsApp number set
      </span>
    );
  }

  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
    >
      {label}
    </a>
  );
}
