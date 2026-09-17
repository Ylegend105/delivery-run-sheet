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
  if (!phoneNumber) {
    return (
      <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-400">
        No WhatsApp number set
      </span>
    );
  }

  const href = `https://wa.me/${toWaNumber(phoneNumber)}?text=${encodeURIComponent(
    message,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
    >
      {label}
    </a>
  );
}
