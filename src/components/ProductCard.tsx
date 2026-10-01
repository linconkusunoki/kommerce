import type { FC } from "hono/jsx";
import { responsiveImage } from "../lib/image.ts";

type ProductCardProps = {
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  image_alt_text?: string | null;
  category_name?: string;
  image_sizes?: string;
  priority?: boolean;
};

export const ProductCard: FC<ProductCardProps> = ({
  name,
  slug,
  price,
  compare_at_price,
  image_url,
  image_alt_text,
  category_name,
  image_sizes = "(max-width: 500px) calc(100vw - 3rem), (max-width: 900px) 50vw, 25vw",
  priority = false,
}) => {
  const onSale = compare_at_price != null && compare_at_price > price;
  const image = responsiveImage(image_url, image_sizes);

  return (
    <a href={`/products/${slug}`} class="product-card">
      <div class="product-card-image">
        {image ? (
          <img
            src={image.src}
            srcset={image.srcSet}
            sizes={image.sizes}
            alt={image_alt_text || name}
            width="500"
            height="500"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchpriority={priority ? "high" : "auto"}
          />
        ) : (
          <div class="product-card-placeholder" />
        )}
        {onSale && <span class="badge badge-sale">Sale</span>}
      </div>
      <div class="product-card-body">
        {category_name && <span class="product-card-category">{category_name}</span>}
        <h2 class="product-card-title">{name}</h2>
        <div class="product-card-price">
          {onSale && <span class="price price-compare">${compare_at_price!.toFixed(2)}</span>}
          <span class={onSale ? "price price-sale" : "price"}>${price.toFixed(2)}</span>
        </div>
      </div>
    </a>
  );
};
