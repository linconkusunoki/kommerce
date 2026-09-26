import type { FC } from "hono/jsx";
import { responsiveImage } from "../lib/image.ts";

type CategoryCardProps = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  priority?: boolean;
};

export const CategoryCard: FC<CategoryCardProps> = ({ name, slug, description, image_url, priority = false }) => {
  const image = responsiveImage(image_url, "(max-width: 500px) calc(100vw - 3rem), (max-width: 900px) 50vw, 25vw");

  return (
    <a href={"/categories/" + slug} class="category-card-link">
      <div class="category-card">
        <div class="category-card-image">
          {image ? (
            <img
              src={image.src}
              srcset={image.srcSet}
              sizes={image.sizes}
              alt={name}
              width="600"
              height="450"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchpriority={priority ? "high" : "auto"}
            />
          ) : (
            <div class="category-card-placeholder" />
          )}
        </div>
        <div class="category-card-body">
          <h3 class="category-card-title">{name}</h3>
          {description && <p class="category-card-desc">{description}</p>}
        </div>
      </div>
    </a>
  );
};
