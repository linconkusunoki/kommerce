import type { ProductPageData } from "./loadProductPage.ts";

export function ProductDetails({ data }: { data: ProductPageData }) {
  const { product, variants, sizes, colors, onSale } = data;

  return (
    <div class="product-detail">
      <div class="product-detail-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.image_alt_text || product.name} />
        ) : (
          <div class="product-detail-placeholder" />
        )}
        {onSale && <span class="badge badge-sale">Sale</span>}
      </div>

      <div class="product-detail-info">
        <span class="product-detail-category">{product.category_name}</span>
        <h1 class="product-detail-title">{product.name}</h1>
        <div class="product-detail-price">
          <span class={onSale ? "price-lg price-sale" : "price-lg"}>${product.price.toFixed(2)}</span>
          {onSale && <span class="price-lg price-compare">${product.compare_at_price!.toFixed(2)}</span>}
        </div>
        {product.description && <p class="product-detail-desc">{product.description}</p>}

        <form method="post" action="/cart/add" class="product-form">
          <input type="hidden" name="product_id" value={String(product.id)} />
          <div class="product-option">
            <label class="product-option-label">Size</label>
            <div class="option-chips">
              {sizes.map((size, index) => (
                <label class="chip">
                  <input type="radio" name="size" value={size} checked={index === 0} />
                  <span class="chip-label">{size}</span>
                </label>
              ))}
            </div>
          </div>
          <div class="product-option">
            <label class="product-option-label">Color</label>
            <div class="option-chips">
              {colors.map((color, index) => (
                <label class="chip">
                  <input type="radio" name="color" value={color} checked={index === 0} />
                  <span class="chip-label">{color}</span>
                </label>
              ))}
            </div>
          </div>
          <div class="product-option">
            <label class="product-option-label">Quantity</label>
            <select name="quantity" class="quantity-select">
              {[1, 2, 3, 4, 5].map((quantity) => (
                <option value={String(quantity)}>{quantity}</option>
              ))}
            </select>
          </div>
          <input
            type="hidden"
            name="variants"
            value={JSON.stringify(
              variants.map((variant) => ({
                id: variant.id,
                size: variant.size,
                color: variant.color,
                stock: variant.stock,
              })),
            )}
          />
          <button type="submit" class="btn btn-primary btn-lg btn-block">
            Add to Cart
          </button>
        </form>
      </div>
    </div>
  );
}
