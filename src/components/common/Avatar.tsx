interface AvatarProps {
  name: string;
  size?: number;
}

const initialsFrom = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Circular monogram avatar with the brand gradient fill. */
export function Avatar({ name, size = 36 }: AvatarProps) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-brand-gradient font-semibold text-content-on-brand ring-1 ring-line-strong"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initialsFrom(name)}
    </span>
  );
}
