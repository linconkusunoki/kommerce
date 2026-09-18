import type { FC } from "hono/jsx";

type ProductCardProps = {
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  image_alt_text?: string | null;
  category_name?: string;
};

export const ProductCard: FC<ProductCardProps> = ({ name, slug, price, compare_at_price, image_url, image_alt_text, category_name }) => {
  const onSale = compare_at_price != null && compare_at_price > price;

  return (
    <a href={`/products/${slug}`} class="product-card">
      <div class="product-card-image">
        {image_url
          ? <img src={image_url} alt={image_alt_text || name} />
          : <div class="product-card-placeholder" />}
        {onSale && <span class="badge badge-sale">Sale</span>}
      </div>
      <div class="product-card-body">
        {category_name && <span class="product-card-category">{category_name}</span>}
        <h3 class="product-card-title">{name}</h3>
        <div class="product-card-price">
          <span class={onSale ? "price price-sale" : "price"}>${price.toFixed(2)}</span>
          {onSale && <span class="price price-compare">${compare_at_price!.toFixed(2)}</span>}
        </div>
      </div>
    </a>
  );
};
