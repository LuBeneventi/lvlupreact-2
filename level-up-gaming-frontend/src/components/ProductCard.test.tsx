// =====================================================
// ✅ ProductCard.test.tsx — versión corregida y estable
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import ProductCard from './ProductCard';
import * as CartContext from '../context/CartContext'; 
import { BrowserRouter as Router } from 'react-router-dom';

// -----------------------------------------------------
// MOCK DEL HOOK useCart
// -----------------------------------------------------

// Creamos el mock de la función addToCart
const mockAddToCart = vi.fn();

// Mock completo del módulo del contexto
vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(() => ({
    addToCart: mockAddToCart,
    cartItems: [],
  })),
}));

// -----------------------------------------------------
// MOCK DEL ROUTER (solo Link y hooks necesarios)
// -----------------------------------------------------
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    useNavigate: vi.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
});

// -----------------------------------------------------
// DATOS BASE DE PRODUCTO
// -----------------------------------------------------
const mockProduct = {
  id: 'p1',
  name: 'PlayStation 5 Slim',
  price: 499990,
  imageUrl: '/images/ps5.png',
  rating: 4.8,
  numReviews: 150,
  isTopSelling: true,
  countInStock: 5,
  specifications: '{}',
  category: 'Consolas',
  reviews: [],
};

// -----------------------------------------------------
// TEST SUITE
// -----------------------------------------------------
describe('🧪 ProductCard: comportamiento visual e interacción', () => {
  // Convertimos el mock de useCart a tipo explícito
  const useCartMock = CartContext.useCart as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddToCart.mockClear();

    // Resetear el hook antes de cada test
    useCartMock.mockReturnValue({
      addToCart: mockAddToCart,
      cartItems: [],
    });
  });

  // -----------------------------------------------------
  it('1 Renderiza nombre, precio y botón "Añadir al Carrito"', () => {
    render(
      <Router>
        <ProductCard product={mockProduct as any} />
      </Router>
    );

    expect(screen.getByText(/PlayStation 5 Slim/i)).toBeInTheDocument();
    expect(screen.getByText(/\$499\.990/)).toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /Añadir al Carrito/i });
    expect(addButton).toBeInTheDocument();
  });

  // -----------------------------------------------------
  it('2️ Llama a addToCart al hacer clic', () => {
    render(
      <Router>
        <ProductCard product={mockProduct as any} />
      </Router>
    );

    const addButton = screen.getByRole('button', { name: /Añadir al Carrito/i });
    fireEvent.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  // -----------------------------------------------------
  it('3️ Muestra "AGOTADO" y desactiva el botón si no hay stock', () => {
    const outOfStockProduct = { ...mockProduct, countInStock: 0 };

    render(
      <Router>
        <ProductCard product={outOfStockProduct as any} />
      </Router>
    );

    const outOfStockButton = screen.getByRole('button', { name: /AGOTADO/i });
    expect(outOfStockButton).toBeInTheDocument();
    expect(outOfStockButton).toBeDisabled();
  });

  // -----------------------------------------------------
  it('4️ Muestra "EN CARRITO" si el producto ya fue agregado', () => {
    useCartMock.mockReturnValue({
      addToCart: mockAddToCart,
      cartItems: [{ product: mockProduct, quantity: 1 }],
    });

    render(
      <Router>
        <ProductCard product={mockProduct as any} />
      </Router>
    );

    const inCartButton = screen.getByRole('button', { name: /EN CARRITO/i });
    expect(inCartButton).toBeInTheDocument();
    expect(inCartButton).toBeDisabled();

    fireEvent.click(inCartButton);
    expect(mockAddToCart).not.toHaveBeenCalled();
  });
});
