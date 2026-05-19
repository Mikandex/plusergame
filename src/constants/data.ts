type ProductType = {
  id: string; 
  description: string; 
  image: string[]; 
  name: string; 
  currency: "GBP" | "NGN";
  price: string; 
  productStatus: "in_stock" | "out_of_stock";
  quantity: number;
}

const dummyProducts: ProductType[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    description: 'Clean minimal cotton tee',
    image: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400'],
    currency: 'NGN', price: '15000', productStatus: 'in_stock', quantity: 10,
  },
  {
    id: '2',
    name: 'Denim Jacket',
    description: 'Vintage style denim',
    image: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'],
    currency: 'NGN', price: '45000', productStatus: 'in_stock', quantity: 5,
  },
  {
    id: '3',
    name: 'Floral Dress',
    description: 'Summer floral print',
    image: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'],
    currency: 'NGN', price: '32000', productStatus: 'in_stock', quantity: 8,
  },
  {
    id: '4',
    name: 'White Sneakers',
    description: 'Casual white sneakers',
    image: ['https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400'],
    currency: 'NGN', price: '28000', productStatus: 'out_of_stock', quantity: 0,
  },
  {
    id: '5',
    name: 'Leather Handbag',
    description: 'Premium leather tote',
    image: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'],
    currency: 'NGN', price: '60000', productStatus: 'in_stock', quantity: 3,
  },
  {
    id: '6',
    name: 'Ankara Skirt',
    description: 'Bold African print skirt',
    image: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400'],
    currency: 'NGN', price: '18000', productStatus: 'in_stock', quantity: 12,
  },
  {
    id: '7',
    name: 'Sunglasses',
    description: 'UV400 polarized shades',
    image: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'],
    currency: 'NGN', price: '12000', productStatus: 'in_stock', quantity: 20,
  },
  {
    id: '8',
    name: 'Wool Sweater',
    description: 'Cozy knit pullover',
    image: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400'],
    currency: 'NGN', price: '22000', productStatus: 'in_stock', quantity: 7,
  },
  {
    id: '9',
    name: 'Running Shoes',
    description: 'Lightweight sport shoes',
    image: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
    currency: 'NGN', price: '35000', productStatus: 'in_stock', quantity: 9,
  },
  {
    id: '10',
    name: 'Wrist Watch',
    description: 'Minimalist leather strap',
    image: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400'],
    currency: 'NGN', price: '55000', productStatus: 'in_stock', quantity: 4,
  },
  {
    id: '11',
    name: 'Jogger Pants',
    description: 'Comfortable everyday joggers',
    image: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400'],
    currency: 'NGN', price: '19000', productStatus: 'in_stock', quantity: 15,
  },
  {
    id: '12',
    name: 'Cap',
    description: 'Embroidered snapback cap',
    image: ['https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400'],
    currency: 'NGN', price: '9000', productStatus: 'out_of_stock', quantity: 0,
  },
  {
    id: '13',
    name: 'Silk Blouse',
    description: 'Elegant satin finish blouse',
    image: ['https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400'],
    currency: 'GBP', price: '4500', productStatus: 'in_stock', quantity: 6,
  },
  {
    id: '14',
    name: 'Bucket Bag',
    description: 'Casual drawstring bucket bag',
    image: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
    currency: 'GBP', price: '6500', productStatus: 'in_stock', quantity: 2,
  }
]

export default { dummyProducts }