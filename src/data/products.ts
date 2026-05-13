import { Pizza as PizzaIcon, Package } from 'lucide-react';

export const MAIS_PEDIDAS = [
  {
    id: 1,
    name: 'Margherita Especial',
    description: 'Molho de tomate italiano, mussarela de búfala artesanal, manjericão fresco e azeite extra virgem.',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 2,
    name: 'Double Pepperoni',
    description: 'Dose dupla de pepperoni crocante sobre generosa camada de mussarela e molho especial.',
    price: 49.00,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 3,
    name: 'Portuguesa da Casa',
    description: 'Presunto, ovos, cebola roxa, ervilhas, azeitonas pretas e o toque secreto do chef.',
    price: 47.00,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000'
  }
];

export const CLASSICAS = [
  {
    id: 4,
    name: 'Calabresa',
    description: 'Calabresa fatiada e cebola.',
    price: 38.00,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 5,
    name: 'Quatro Queijos',
    description: 'Mussarela, provolone, gorgonzola e catupiry.',
    price: 42.00,
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 6,
    name: 'Frango com Catupiry',
    description: 'Frango desfiado com o original catupiry.',
    price: 40.00,
    icon: PizzaIcon
  },
  {
    id: 7,
    name: 'Camarão Premium',
    description: 'Camarões selecionados e cream cheese.',
    price: 62.00,
    soldOut: true,
    icon: Package
  }
];

export const ALL_PRODUCTS = [...MAIS_PEDIDAS, ...CLASSICAS];
