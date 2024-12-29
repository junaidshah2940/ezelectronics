// @ts-ignore
import request from "supertest";
import {app} from "../index";
import {beforeAll, describe, expect} from "@jest/globals";
import {cleanup} from "../src/db/cleanup";
import {Category, Product} from "../src/components/product";

const routePath = "/ezelectronics" //Base route path for the API

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
let adminCookie: string
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
let managerCookie: string
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
let customerCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

const products = [
    new Product(799.90, "Huawei Matebook", Category.LAPTOP, "2022-01-01", "test on Laptop", 10),
    new Product(899.90, "Samsung Galaxy S21", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 10),
    new Product(999.90, "Samsung Galaxy S22", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 10),
    new Product(1199.90, "LG Refrigerator", Category.APPLIANCE, "2022-01-01", "test on Appliance", 5),
    new Product(599.90, "Dell Inspiron", Category.LAPTOP, "2022-01-01", "test on Laptop", 1)
]
const registerProducts = async (product: Product) => {
    await request(app)
        .post(`${routePath}/products`)
        .send(product)
        .set('Cookie', adminCookie)
        .expect(200)
}

beforeAll(async () => {
    cleanup()
    await new Promise(resolve => setTimeout(resolve, 15000))
    await postUser(admin)
    adminCookie = await login(admin)
    await postUser(manager)
    managerCookie = await login(manager)
    await postUser(customer)
    customerCookie = await login(customer)
    for (const product of products) {
        await registerProducts(product)
    }
})

afterAll(() => {
    cleanup()
})

describe("Product routes integration tests", () => {
    describe("GET /products", () => {
        test("Should return all products for admin", async () => {
            const response = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .expect(200)
            let products = response.body
            expect(products.length).toBe(5)
            expect(products[0].sellingPrice).toBe(799.90)
            expect(products[0].model).toBe("Huawei Matebook")
            expect(products[0].category).toBe("Laptop")
            expect(products[0].arrivalDate).toBe("2022-01-01")
            expect(products[0].details).toBe("test on Laptop")
            expect(products[0].quantity).toBe(10)
        });

        test("Should return all products for manager", async () => {
            const response = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', managerCookie)
                .expect(200)
            let products = response.body
            expect(products.length).toBe(5)
            expect(products[0].sellingPrice).toBe(799.90)
            expect(products[0].model).toBe("Huawei Matebook")
            expect(products[0].category).toBe("Laptop")
            expect(products[0].arrivalDate).toBe("2022-01-01")
            expect(products[0].details).toBe("test on Laptop")
            expect(products[0].quantity).toBe(10)
        });

        test("Should fail to return all products for customer", async () => {
            const response = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', customerCookie)
            expect(response.status).toBe(401);
        });

        test('should return products grouped by category Smartphone', async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .query({grouping: 'category', category: 'Smartphone'})
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        test("Should fail to return all products with invalid parameters", async () => {
            const response = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .query({grouping: 'invalid'})
            expect(response.status).toBe(422)

            const response2 = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .query({category: 'invalid'})
            expect(response2.status).toBe(422)

            const response3 = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .query({grouping: 'category', category: 'invalid'})
            expect(response3.status).toBe(422)

            const response4 = await request(app)
                .get(`${routePath}/products`)
                .set('Cookie', adminCookie)
                .query({grouping: 'category'})
            expect(response4.status).toBe(422)
        });

        test('should return products grouped by category Laptop', async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .query({grouping: 'category', category: 'Laptop'})
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        test('should return product with model Huawei Matebook', async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .query({grouping: 'model', model: 'Huawei Matebook'})
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].model).toBe('Huawei Matebook');
        });

        test('should return 404 for product with model that does not exist', async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .query({grouping: 'model', model: 'Huawei Matebook Pro'})
                .set('Cookie', adminCookie);

            expect(res.status).toBe(404);
        });
    });

    describe("POST /products", () => {
        test("Should register a new product as admin", async () => {
            const newProduct = {
                model: "iPhone 13",
                category: "Smartphone",
                quantity: 5,
                details: "",
                sellingPrice: 200,
                arrivalDate: "2024-01-01"
            };
            await request(app)
                .post(`${routePath}/products`)
                .send(newProduct)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: 'model', model: 'iPhone 13'})
                .expect(200);

            const products = response.body;
            expect(products.length).toBe(1);
            expect(products[0].model).toBe("iPhone 13");
            expect(products[0].category).toBe("Smartphone");
            expect(products[0].quantity).toBe(5);
            expect(products[0].sellingPrice).toBe(200);
            expect(products[0].arrivalDate).toBe("2024-01-01");
        });

        test("Should register a new product as manager", async () => {
            const newProduct = {
                model: "iPhone 14",
                category: "Smartphone",
                quantity: 3,
                details: "Latest model",
                sellingPrice: 300,
                arrivalDate: "2024-01-01"
            };
            await request(app)
                .post(`${routePath}/products`)
                .send(newProduct)
                .set("Cookie", managerCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({grouping: 'model', model: 'iPhone 14'})
                .expect(200);

            const products = response.body;
            expect(products.length).toBe(1);
            expect(products[0].model).toBe("iPhone 14");
            expect(products[0].category).toBe("Smartphone");
            expect(products[0].quantity).toBe(3);
            expect(products[0].sellingPrice).toBe(300);
            expect(products[0].arrivalDate).toBe("2024-01-01");
        });

        test("Should fail to register a new product as customer", async () => {
            const newProduct = {
                model: "iPhone 15",
                category: "Smartphone",
                quantity: 2,
                details: "",
                sellingPrice: 400,
                arrivalDate: "2024-01-01"
            };
            const response = await request(app)
                .post(`${routePath}/products`)
                .send(newProduct)
                .set("Cookie", customerCookie)
                .expect(401);
        });

        test("Should return 409 if the product model already exists", async () => {
            const duplicateProduct = {
                model: "iPhone 13",
                category: "Smartphone",
                quantity: 5,
                details: "",
                sellingPrice: 200,
                arrivalDate: "2024-01-01"
            };
            const response = await request(app)
                .post(`${routePath}/products`)
                .send(duplicateProduct)
                .set("Cookie", adminCookie)
                .expect(409);
        });

        test("Should return 400 if arrival date is after the current date", async () => {
            const futureDateProduct = {
                model: "iPhone 16",
                category: "Smartphone",
                quantity: 2,
                details: "",
                sellingPrice: 500,
                arrivalDate: "2025-01-01"
            };
            const response = await request(app)
                .post(`${routePath}/products`)
                .send(futureDateProduct)
                .set("Cookie", adminCookie)
                .expect(400);
        });

        test('should register a product with optional details and arrival date', async () => {
            const product = new Product(1499.99, "HP Spectre x360", Category.LAPTOP, null, null, 5);

            const res = await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
        });

        test('should return 422 for negative quantity', async () => {
            const product = {
                model: "HP Spectre x360",
                category: Category.LAPTOP,
                quantity: -5,
                details: "High-end laptop",
                sellingPrice: 1499.99,
                arrivalDate: "2023-01-01"
            };

            const res = await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(422);
        });

        test('should return 200 for 0.01 selling price', async () => {
            const product = {
                model: "Macbook Air",
                category: Category.LAPTOP,
                quantity: 5,
                details: "High-end laptop",
                sellingPrice: 0.01,
                arrivalDate: "2023-01-01"
            };

            const res = await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
        });

        test('should return 422 for zero selling price', async () => {
            const product = {
                model: "HP Spectre x360",
                category: Category.LAPTOP,
                quantity: 5,
                details: "High-end laptop",
                sellingPrice: 0,
                arrivalDate: "2023-01-01"
            };

            const res = await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(422);
        });

        test('should return 422 for invalid category', async () => {
            const product = {
                model: "HP Spectre x360",
                category: "InvalidCategory",
                quantity: 5,
                details: "High-end laptop",
                sellingPrice: 1499.99,
                arrivalDate: "2023-01-01"
            };

            const res = await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(422);
        });

        test('should return 422 for empty model', async () => {
            const product = {
                model: "",
                category: Category.LAPTOP,
                quantity: 5,
                details: "High-end laptop",
                sellingPrice: 1499.99,
                arrivalDate: "2023-01-01"
            };

            const res = await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(422);
        });

    });

    describe("PATCH /products/:model", () => {
        test("Should increase the product quantity as admin", async () => {
            const model = "iPhone 13";
            const update = { quantity: 3 };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(200);
            expect(response.body.quantity).toBe(8);
        });

        test("Should increase the product quantity as manager", async () => {
            const model = "iPhone 14";
            const update = { quantity: 2 };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", managerCookie)
                .expect(200);
            expect(response.body.quantity).toBe(5);
        });

        test("Should fail to increase the product quantity as customer", async () => {
            const model = "iPhone 13";
            const update = { quantity: 3 };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", customerCookie)
                .expect(401);
        });

        test("Should return 404 for non-existent product model", async () => {
            const model = "NonExistentModel";
            const update = { quantity: 3 };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(404);
        });

        test("Should return 400 if changeDate is after the current date", async () => {
            const model = "iPhone 13";
            const update = { quantity: 3, changeDate: "2025-01-01" };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(400);
        });

        test("Should return 400 if changeDate is before the product's arrival date", async () => {
            const model = "iPhone 13";
            const update = { quantity: 3, changeDate: "2018-01-01" };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", adminCookie);

            console.log(response.body);
            expect(response.status).toBe(400);
        });

        test('should increase product quantity with optional change date', async () => {
            const res = await request(app)
                .patch(`${routePath}/products/Samsung Galaxy S22`)
                .send({ quantity: 5, changeDate: null })
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
            expect(res.body.quantity).toBe(15);
        });

        test("Should return 422 if quantity is not greater than 0", async () => {
            const model = "iPhone 13";
            const update = { quantity: -1 };
            const response = await request(app)
                .patch(`${routePath}/products/${model}`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(422);
        });

        test('should return 404 for empty model', async () => {
            const res = await request(app)
                .patch(`${routePath}/products/`)
                .send({ quantity: 5, changeDate: "2023-01-01" })
                .set('Cookie', adminCookie);

            expect(res.status).toBe(404);
        });
    });

    describe("PATCH /products/:model/sell", () => {
        test("Should record a sale and reduce product quantity as admin", async () => {
            const testProduct = new Product(799.90, "iPhone 15", Category.SMARTPHONE, "2024-01-01", "test on Smartphone", 8);
            await registerProducts(testProduct);

            const model = "iPhone 15";
            const update = { quantity: 2, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({ grouping: "model", model: "iPhone 15" })
                .expect(200);

            const product = response.body[0];
            expect(product.quantity).toBe(6); // Initially 8, sold 2
        });

        test("Should record a sale and reduce product quantity as manager", async () => {
            const testProduct = new Product(799.90, "iPhone 11", Category.SMARTPHONE, "2024-01-01", "test on Smartphone", 5);
            await registerProducts(testProduct);

            const model = "iPhone 11";
            const update = { quantity: 1, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", managerCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: "model", model: "iPhone 11" })
                .expect(200);

            const product = response.body[0];
            expect(product.quantity).toBe(4); // Initially 5, sold 1
        });

        test("Should fail to record a sale as customer", async () => {
            const model = "iPhone 13";
            const update = { quantity: 1, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", customerCookie)
                .expect(401);
        });

        test("Should return 404 for non-existent product model", async () => {
            const model = "NonExistentModel";
            const update = { quantity: 1, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(404);
        });

        test("Should return 400 if sellingDate is after the current date", async () => {
            const model = "iPhone 13";
            const update = { quantity: 1, sellingDate: "2025-01-01" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(400);
        });

        test("Should return 400 if sellingDate is before the product's arrival date", async () => {
            const model = "iPhone 13";
            const update = { quantity: 1, sellingDate: "2018-01-01" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(400);
        });

        test("Should return 409 if product quantity is 0", async () => {
            const model = "Dell Inspiron"; // Quantity initially 1, sell all to make it 0
            const update = { quantity: 1, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(200);

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(409);
        });

        test("Should return 409 if product quantity is lower than requested", async () => {
            const model = "Huawei Matebook"; // Quantity initially 10
            const update = { quantity: 11, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(409);
        });

        test("Should return 422 if quantity is not greater than 0", async () => {
            const model = "iPhone 13";
            const update = { quantity: -1, sellingDate: "2024-01-02" };

            await request(app)
                .patch(`${routePath}/products/${model}/sell`)
                .send(update)
                .set("Cookie", adminCookie)
                .expect(422);
        });

        test('should return 404 for empty model', async () => {
            const res = await request(app)
                .patch(`${routePath}/products//sell`)
                .send({ quantity: 5, sellingDate: "2023-01-01" })
                .set('Cookie', adminCookie);

            expect(res.status).toBe(404);
        });

        test('should sell product quantity with optional selling date', async () => {
            const res = await request(app)
                .patch(`${routePath}/products/Samsung Galaxy S22/sell`)
                .send({ quantity: 5, sellingDate: null })
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
            expect(res.body.quantity).toBe(10);
        });
    });

    describe("GET /products/available", () => {
        test("Should return all available products for a logged-in user", async () => {
            const response = await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .expect(200);

            const products = response.body;
            expect(products.length).toBe(10); // All products should be returned
        });

        test("Should return available products filtered by category", async () => {
            const response = await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "category", category: "Smartphone" })
                .set("Cookie", adminCookie)
                .expect(200);

            const products = response.body as Product[];
            expect(products.length).toBe(6); // Should return only the smartphones
            expect(products.every(product => product.category === "Smartphone")).toBe(true);
        });

        test("Should return available products filtered by model", async () => {
            const response = await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "model", model: "iPhone 13" })
                .set("Cookie", adminCookie)
                .expect(200);

            const products = response.body;
            expect(products.length).toBe(1); // Should return only the iPhone 13
            expect(products[0].model).toBe("iPhone 13");
        });

        test("Should return 404 if model does not exist", async () => {
            await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "model", model: "NonExistentModel" })
                .set("Cookie", adminCookie)
                .expect(404);
        });

        test("Should return 422 if grouping is null and category or model is not null", async () => {
            await request(app)
                .get(`${routePath}/products/available`)
                .query({ category: "Smartphone" })
                .set("Cookie", adminCookie)
                .expect(422);

            await request(app)
                .get(`${routePath}/products/available`)
                .query({ model: "iPhone 13" })
                .set("Cookie", adminCookie)
                .expect(422);
        });

        test("Should return 422 if grouping is category and category is null or model is not null", async () => {
            await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "category", model: "iPhone 13" })
                .set("Cookie", adminCookie)
                .expect(422);

            await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "category" })
                .set("Cookie", adminCookie)
                .expect(422);
        });

        test("Should return 422 if grouping is model and model is null or category is not null", async () => {
            await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "model", category: "Smartphone" })
                .set("Cookie", adminCookie)
                .expect(422);

            await request(app)
                .get(`${routePath}/products/available`)
                .query({ grouping: "model" })
                .set("Cookie", adminCookie)
                .expect(422);
        });

        test("Should fail to return available products for a non-logged-in user", async () => {
            const response = await request(app)
                .get(`${routePath}/products/available`)
                .expect(401);
        });
    });

    describe("DELETE /products/:model", () => {
        test("Should delete a product for admin", async () => {
            await request(app)
                .delete(`${routePath}/products/iPhone 13`)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);

            const products = response.body as Product[];
            expect(products.some(product => product.model === "iPhone 13")).toBe(false);
        });

        test("Should delete a product for manager", async () => {
            await request(app)
                .delete(`${routePath}/products/iPhone 14`)
                .set("Cookie", managerCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .expect(200);

            const products = response.body as Product[];
            expect(products.some(product => product.model === "iPhone 14")).toBe(false);
        });

        test("Should return 404 if product does not exist", async () => {
            await request(app)
                .delete(`${routePath}/products/NonExistentModel`)
                .set("Cookie", adminCookie)
                .expect(404);
        });

        test("Should fail to delete a product for customer", async () => {
            await request(app)
                .delete(`${routePath}/products/iPhone 15`)
                .set("Cookie", customerCookie)
                .expect(401);
        });

        test('should return 401 if not logged in', async () => {
            const res = await request(app)
                .delete(`${routePath}/products`);

            expect(res.status).toBe(401);
        });
    });

    describe("DELETE /products", () => {
        test("Should delete all products for admin", async () => {
            await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200);

            const products = response.body;
            expect(products.length).toBe(0);
        });

        test("Should delete all products for manager", async () => {
            for (const product of products) {
                await registerProducts(product);
            }

            await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .expect(200);

            const productsRepsonse = response.body;
            expect(productsRepsonse.length).toBe(0);
        });

        test('should return 401 if not logged in', async () => {
            const model = "Huawei Matebook";

            const res = await request(app)
                .delete(`${routePath}/products/${model}`);

            expect(res.status).toBe(401);
        });

        test("Should fail to delete all products for customer", async () => {
            await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie", customerCookie)
                .expect(401);
        });
    });

});