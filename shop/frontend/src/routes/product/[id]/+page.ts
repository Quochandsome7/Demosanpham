import { api } from '$lib/api';

export async function load({ params }) {
  try {
    const res = await api.getProduct(Number(params.id));
    const relatedRes = await api.getProducts({ limit: '4', category_id: res.data.category_id });
    
    return {
      product: res.data,
      relatedProducts: relatedRes.data || []
    };
  } catch (e) {
    return {
      product: null,
      relatedProducts: []
    };
  }
}
