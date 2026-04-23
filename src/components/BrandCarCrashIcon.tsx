/** `public/car_crash.svg`，与 favicon 同源 */
const SRC = `${import.meta.env.BASE_URL}car_crash.svg?v=8`;

type Props = { className?: string };

export default function BrandCarCrashIcon({ className }: Props) {
  return (
    <img src={SRC} alt="" draggable={false} aria-hidden className={className} />
  );
}
