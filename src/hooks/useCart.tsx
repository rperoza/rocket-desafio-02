import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const newValues = [...cart];
      const quantidadeEstoque: Stock = (await api.get(`/stock/${productId}`)).data;
      const index = newValues.findIndex(x => x.id === productId);
      const produtoPesquisado = (await api.get(`/products/${productId}`)).data;

      if(!produtoPesquisado)
        throw new Error;

      if (cart.findIndex(x => x.id === productId) === -1 && quantidadeEstoque.amount > 0) {
        newValues.push({ ...produtoPesquisado, amount: 1 });
      }
      else if (newValues[index].amount + 1 > quantidadeEstoque.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      else {
        newValues[index].amount++;
      }
      setCart(newValues);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newValues));
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.findIndex(x => x.id === productId) === -1)
        throw new Error;

      const newValues = [...cart].filter(x => x.id !== productId);
      setCart(newValues);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newValues));
      // TODO
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1)
        throw new Error;
      // TODO
      const newCart = [...cart];
      const index = newCart.findIndex(x => x.id === productId);
      const quantidadeEstoque: Stock = (await api.get(`/stock/${productId}`)).data;

      if (amount > quantidadeEstoque.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      newCart[index].amount = amount;
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
