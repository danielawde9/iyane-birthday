/**
 * The one thing a guest must understand about editing here: there are no
 * accounts, so the ability to change their own row lives in this browser and
 * nowhere else. Said plainly, next to the controls, rather than buried.
 */
export function ThisDeviceNote({ className = "" }: { className?: string }) {
  return (
    <p className={`font-body text-[0.8rem] leading-snug text-ink-soft ${className}`}>
      You can change this because you posted it from this browser. Switch phone, or clear your history, and the
      controls go — just ask the host, they can fix anything.
    </p>
  );
}
