import type { ICartRepository, IVariantRepository } from "../repositories/interfaces.ts";
import type { CartItem } from "../types/index.ts";

export class CartService {
  constructor(
    private cartRepo: ICartRepository,
    private variantRepo: IVariantRepository,
  ) {}

  getCart(sessionId: string): { items: CartItem[]; subtotal: number; count: number } {
    const items = this.cartRepo.getItems(sessionId);
    const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
    const count = this.cartRepo.getCount(sessionId);
    return { items, subtotal, count };
  }

  getCount(sessionId: string): number {
    return this.cartRepo.getCount(sessionId);
  }

  // Returns true on success, false if variant not found
  addToCart(sessionId: string, productId: number, size: string, color: string, requestedQty: number): boolean {
    const variant = this.variantRepo.findByOptions(productId, size, color);
    if (!variant) return false;

    const qty = Math.max(1, Math.min(10, requestedQty));
    const existing = this.cartRepo.getExistingItem(sessionId, variant.id);

    if (existing) {
      const newQty = Math.min(existing.quantity + qty, variant.stock, 10);
      this.cartRepo.updateItem(existing.id, sessionId, newQty);
    } else {
      const finalQty = Math.min(qty, variant.stock, 10);
      this.cartRepo.addItem(sessionId, variant.id, finalQty);
    }

    return true;
  }

  updateQuantity(sessionId: string, itemId: number, quantity: number): void {
    const qty = Math.max(1, Math.min(10, quantity));
    this.cartRepo.updateItem(itemId, sessionId, qty);
  }

  removeItem(sessionId: string, itemId: number): void {
    this.cartRepo.removeItem(itemId, sessionId);
  }
}
