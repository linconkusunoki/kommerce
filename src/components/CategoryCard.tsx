import type { FC } from "hono/jsx";
import { responsiveImage } from "../lib/image.ts";

type CategoryCardProps = {
  name: string;
  slug: string;
  image_url: string | null;
  priority?: boolean;
};

export const CategoryCard: FC<CategoryCardProps> = ({ name, slug, image_url, priority = false }) => {
  const image = responsiveImage(image_url, "80px");

  return (
    <a href={"/categories/" + slug} class="category-card">
      <span class="category-card-image">
        {image ? (
          <img
            src={image.src}
            srcset={image.srcSet}
            sizes={image.sizes}
            alt={name}
            width="180"
            height="180"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchpriority={priority ? "high" : "auto"}
          />
        ) : (
          <span class="category-card-placeholder" />
        )}
      </span>
      <span class="category-card-title">{name}</span>
    </a>
  );
};
