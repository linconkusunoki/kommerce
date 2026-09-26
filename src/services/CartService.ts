import type { ICartRepository, IVariantRepository } from "../repositories/interfaces.ts";
import type { CartItem } from "../types/index.ts";

export class CartService {
  constructor(
    private cartRepo: ICartRepository,
    private variantRepo: IVariantRepository,
  ) {}

  async getCart(sessionId: string): Promise<{ items: CartItem[]; subtotal: number; count: number }> {
    const items = await this.cartRepo.getItems(sessionId);
    const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
    const count = await this.cartRepo.getCount(sessionId);
    return { items, subtotal, count };
  }

  getCount(sessionId: string) {
    return this.cartRepo.getCount(sessionId);
  }

  // Returns true on success, false if variant not found
  async addToCart(
    sessionId: string,
    productId: number,
    size: string,
    color: string,
    requestedQty: number,
  ): Promise<boolean> {
    const variant = await this.variantRepo.findByOptions(productId, size, color);
    if (!variant) return false;

    const qty = Math.max(1, Math.min(10, requestedQty));
    const existing = await this.cartRepo.getExistingItem(sessionId, variant.id);

    if (existing) {
      const newQty = Math.min(existing.quantity + qty, variant.stock, 10);
      await this.cartRepo.updateItem(existing.id, sessionId, newQty);
    } else {
      const finalQty = Math.min(qty, variant.stock, 10);
      await this.cartRepo.addItem(sessionId, variant.id, finalQty);
    }

    return true;
  }

  async updateQuantity(sessionId: string, itemId: number, quantity: number): Promise<void> {
    const qty = Math.max(1, Math.min(10, quantity));
    await this.cartRepo.updateItem(itemId, sessionId, qty);
  }

  async removeItem(sessionId: string, itemId: number): Promise<void> {
    await this.cartRepo.removeItem(itemId, sessionId);
  }
}
