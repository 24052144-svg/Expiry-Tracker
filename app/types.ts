export interface Product {
    _id: string;
    product_name: string;
    category: string;
    image_url: string;
    quantity: string | number;
    expiry_date: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Recipe {
    id: number | string;
    title: string;
    image: string;
    [key: string]: unknown;
}
