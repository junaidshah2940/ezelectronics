import request from 'supertest';
import { app } from "../index";
import { cleanup } from "../src/db/cleanup";
import { beforeAll, afterAll, describe, test, expect } from "@jest/globals";
import { Category, Product } from '../src/components/product';

const routePath = "/ezelectronics"; // Base route path for the API

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
let adminCookie: string;
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };
let managerCookie: string;
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
let customerCookie: string;

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

const products = [
    new Product(799.90, "Huawei Matebook", Category.LAPTOP, "2022-01-01", "test on Laptop", 10),
    new Product(899.90, "Samsung Galaxy S21", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 10),
    new Product(999.90, "Samsung Galaxy S22", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 10),
    new Product(1199.90, "LG Refrigerator", Category.APPLIANCE, "2022-01-01", "test on Appliance", 5),
    new Product(599.90, "Dell Inspiron", Category.LAPTOP, "2022-01-01", "test on Laptop", 1)
];

const registerProducts = async (product: Product) => {
    await request(app)
        .post(`${routePath}/products`)
        .send(product)
        .set('Cookie', adminCookie)
        .expect(200);
};

beforeAll(async () => {
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 15000))
    await postUser(admin);
    adminCookie = await login(admin);
    await postUser(manager);
    managerCookie = await login(manager);
    await postUser(customer);
    customerCookie = await login(customer);
    for (const product of products) {
        await registerProducts(product);
    }
});

afterAll(() => {
    cleanup();
});

describe('Review API tests', () => {
    describe('Create Review', () => {
        test('should create a new review', async () => {
            const review = {
                score: 5,
                comment: "Excellent product!"
            };


            const res = await request(app)
                .post(`${routePath}/reviews/Huawei Matebook`)
                .send(review)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
        });

        test('should return 422 for invalid score', async () => {
            const review = {
                score: 6, // Invalid score
                comment: "Excellent product!"
            };

            const res = await request(app)
                .post(`${routePath}/reviews/Huawei Matebook`)
                .send(review)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(422);
        });

        test('should return 404 for non-existent product', async () => {
            const review = {
                score: 5,
                comment: "Excellent product!"
            };

            const res = await request(app)
                .post(`${routePath}/reviews/NonExistentProduct`)
                .send(review)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        });
    });

    describe('Retrieve Reviews', () => {
        test('should retrieve all reviews for a product', async () => {
            const res = await request(app)
                .get(`${routePath}/reviews/Huawei Matebook`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test('should return 404 for non-existent product reviews', async () => {
            const res = await request(app)
                .get(`${routePath}/reviews/NonExistentProduct`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        });
    });

    describe('Delete Review', () => {
        test('should delete a review for a product', async () => {
            const res = await request(app)
                .delete(`${routePath}/reviews/Huawei Matebook`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
        });

        test('should return 404 for non-existent product review', async () => {
            const res = await request(app)
                .delete(`${routePath}/reviews/NonExistentProduct`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        });
    });

    describe('Delete All Reviews for a Product', () => {
        test('should delete all reviews for a product', async () => {
            const res = await request(app)
                .delete(`${routePath}/reviews/Huawei Matebook/all`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
        });

        test('should return 404 for non-existent product', async () => {
            const res = await request(app)
                .delete(`${routePath}/reviews/NonExistentProduct/all`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(404);
        });
    });

    describe('Delete All Reviews', () => {
        test('should delete all reviews', async () => {
            const res = await request(app)
                .delete(`${routePath}/reviews`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
        });
    });
});
