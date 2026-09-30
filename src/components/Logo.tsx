import type { FC } from "hono/jsx";

type LogoProps = {
  href?: string;
  class?: string;
};

export const Logo: FC<LogoProps> = ({ href, class: className = "logo" }) => {
  const mark = (
    <>
      <span class="logo-k">K</span>ommerce
    </>
  );

  return href ? (
    <a href={href} class={className}>
      {mark}
    </a>
  ) : (
    <span class={className}>{mark}</span>
  );
};
