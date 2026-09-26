const cardImageWidths = [320, 400, 500, 640];

function imageUrl(source: string, width: number): string {
  try {
    const url = new URL(source);
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format");
    url.searchParams.set("q", "80");
    return url.toString();
  } catch {
    return source;
  }
}

export function responsiveImage(source: string | null, sizes: string, widths = cardImageWidths) {
  if (!source) return null;

  return {
    src: imageUrl(source, 500),
    srcSet: widths.map((width) => `${imageUrl(source, width)} ${width}w`).join(", "),
    sizes,
  };
}
