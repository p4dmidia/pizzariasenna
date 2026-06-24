import { Pizza as PizzaIcon, Package, Wine, IceCream, Sparkles } from 'lucide-react';

export const MAIS_PEDIDAS = [
  {
    id: 1,
    name: 'Margherita Especial',
    description: 'Molho de tomate italiano, mussarela de búfala artesanal, manjericão fresco e azeite extra virgem.',
    price: 45.00,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 2,
    name: 'Double Pepperoni',
    description: 'Dose dupla de pepperoni crocante sobre generosa camada de mussarela e molho especial.',
    price: 49.00,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 3,
    name: 'Portuguesa da Casa',
    description: 'Presunto, ovos, cebola roxa, ervilhas, azeitonas pretas e o toque secreto do chef.',
    price: 47.00,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000'
  }
];

export const CLASSICAS = [
  {
    id: 4,
    name: 'Calabresa',
    description: 'Calabresa fatiada e cebola.',
    price: 38.00,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 5,
    name: 'Quatro Queijos',
    description: 'Mussarela, provolone, gorgonzola e catupiry.',
    price: 42.00,
    category: 'pizzas',
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 6,
    name: 'Frango com Catupiry',
    description: 'Frango desfiado com o original catupiry.',
    price: 40.00,
    category: 'pizzas',
    icon: PizzaIcon
  },
  {
    id: 7,
    name: 'Camarão Premium',
    description: 'Camarões selecionados e cream cheese.',
    price: 62.00,
    soldOut: true,
    category: 'pizzas',
    icon: Package
  }
];

export const BEBIDAS = [
  {
    id: 101,
    name: 'Coca-Cola 2L',
    description: 'Refrigerante Coca-Cola garrafa PET de 2 litros gelada.',
    price: 12.00,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 102,
    name: 'Coca-Cola Lata',
    description: 'Refrigerante Coca-Cola lata 350ml trincando de gelada.',
    price: 6.00,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 103,
    name: 'Guaraná Antarctica 2L',
    description: 'Refrigerante Guaraná Antarctica garrafa PET de 2 litros gelado.',
    price: 11.00,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 104,
    name: 'Suco de Laranja Natural',
    description: 'Suco natural de laranja espremida na hora 500ml.',
    price: 8.50,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 105,
    name: 'Cerveja Heineken Long Neck',
    description: 'Cerveja Heineken Long Neck 330ml gelada.',
    price: 9.00,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 106,
    name: 'Água Mineral sem Gás',
    description: 'Garrafa de água mineral sem gás 500ml.',
    price: 4.00,
    category: 'bebidas',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1000'
  }
];

export const COMBOS = [
  {
    id: 201,
    name: 'Combo Master',
    description: '1 Pizza Grande (Calabresa, Margherita ou Quatro Queijos) + 1 Refrigerante 2L de sua escolha.',
    price: 55.00,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 202,
    name: 'Combo Casal',
    description: '1 Pizza Média + 2 Latas de Refrigerante + 1 Pizza Doce de Chocolate broto para sobremesa.',
    price: 69.00,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1615557960901-b458b82bc7b2?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 203,
    name: 'Combo Família',
    description: '2 Pizzas Grandes + 1 Refrigerante 2L + 1 Porção generosa de Batata Frita.',
    price: 99.00,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 204,
    name: 'Combo Individual',
    description: '1 Pizza Brotinho + 1 Lata de Refrigerante de sua escolha.',
    price: 35.00,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=1000'
  }
];

export const SOBREMESAS = [
  {
    id: 301,
    name: 'Pizza Doce de Chocolate',
    description: 'Deliciosa pizza broto coberta com chocolate ao leite Nestlé e morangos frescos fatiados.',
    price: 25.00,
    category: 'sobremesas',
    image: 'https://images.unsplash.com/photo-1617343251257-b5d709934bcd?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 302,
    name: 'Petit Gâteau Clássico',
    description: 'Bolo quente de chocolate com recheio cremoso e fluído, acompanhado de sorvete de creme.',
    price: 18.00,
    category: 'sobremesas',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=1000'
  }
];

export const ALL_PRODUCTS = [...MAIS_PEDIDAS, ...CLASSICAS, ...BEBIDAS, ...COMBOS, ...SOBREMESAS];

