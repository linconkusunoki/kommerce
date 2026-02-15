import type { FC } from "hono/jsx";

type CategoryCardProps = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export const CategoryCard: FC<CategoryCardProps> = ({ name, description, image_url }) => {
  return (
    <div class="category-card">
      <div class="category-card-image">
        {image_url
          ? <img src={image_url} alt={name} />
          : <div class="category-card-placeholder" />}
      </div>
      <div class="category-card-body">
        <h3 class="category-card-title">{name}</h3>
        {description && <p class="category-card-desc">{description}</p>}
      </div>
    </div>
  );
};
