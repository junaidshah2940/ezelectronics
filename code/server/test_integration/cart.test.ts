// @ts-ignore
import request from 'supertest';
import { app } from "../index"
import {beforeAll, afterAll, beforeEach, afterEach} from "@jest/globals";
import {Category, Product} from "../src/components/product";
import {cleanup} from "../src/db/cleanup";

const routePath = "/ezelectronics" //Base route path for the API

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
let adminCookie: string
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
let managerCookie: string
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
let customerCookie: string

const addProduct = async (product: Product) => {
    await request(app)
        .post(`${routePath}/carts`)
        .send(product)
        .set('Cookie', customerCookie)
        .expect(200)
}


const sellProduct = async (product: Product, quantity: {quantity: number}) => {
    await request(app)
        .patch(`${routePath}/products/${product.model}/sell`)
        .send(quantity)
        .set('Cookie', managerCookie)
        .expect(200)

}

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const clearCarts = async () => {
    await request(app)
        .delete(`${routePath}/carts`)
        .set('Cookie', adminCookie)
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
    new Product(599.90, "Dell Inspiron", Category.LAPTOP, "2022-01-01", "test on Laptop", 9),
    new Product(799.90, "motorola", Category.LAPTOP, "2022-01-01", "test on Laptop", 1)
]
const registerProducts = async (product: Product) => {
    await request(app)
        .post(`${routePath}/products`)
        .send(product)
        .set('Cookie', adminCookie)
        .expect(200)
}

const logout = async (cookie: string) => {
    await request(app)
        .delete(`${routePath}/sessions`)
        .set('Cookie', cookie)
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




afterAll( () => {
    cleanup()
})


describe('Cart integration test', () => {
    describe('GET /carts', () => {
        test('Should return a cart when getCart is called', async () => {
            const res = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toBe(0);
            expect(res.body).toHaveProperty('customer');
            expect(res.body.customer).toBe(customer.username);
            expect(res.body).toHaveProperty('paid');
            expect(res.body.paid).toBe(false);
            expect(res.body).toHaveProperty('paymentDate');
            expect(res.body.paymentDate).toBe(null);
            expect(res.body).toHaveProperty('products');
            expect(res.body.products).toHaveLength(0);
        });

        test('Should return a cart with products when getCart is called', async () => {
            await addProduct(products[0]);
            await addProduct(products[1]);
            await addProduct(products[2]);
            await addProduct(products[3]);
            await addProduct(products[4]);

            const res = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toBe(4499.5);
            expect(res.body.products).toHaveLength(5);
        })

        test("Should fail to return cart for admin", async () => {
            const res = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(401);
        })

        test("Should fail to return cart for manager", async () => {
            const res = await request(app)
                .get(`${routePath}/carts`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(401);
        })

    });

    describe('POST /carts', () => {
        test('Should add a product to the cart', async () => {
            const res = await request(app)
                .post(`${routePath}/carts`)
                .send({model: "Huawei Matebook"})
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);

        });

        test('Should fail to add if there is no model', async () => {
            const res = await request(app)
                .post(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(422);
        });

        test('Should fail if model is not a string', async () => {
            const res = await request(app)
                .post(`${routePath}/carts`)
                .send({ model: 123 })
                .set('Cookie', customerCookie);

            expect(res.status).toBe(422);
        });

        test('Should fail if is a admin', async () => {
            const res = await request(app)
                .post(`${routePath}/carts`)
                .send({model: "iPhone13"})
                .set('Cookie', adminCookie);

            expect(res.status).toBe(401);
        });

        test('Should fail if is a manager', async () => {
            const res = await request(app)
                .post(`${routePath}/carts`)
                .send({model: "iPhone13"})
                .set('Cookie', managerCookie);

            expect(res.status).toBe(401);
        });

        test('Should fail if product is not found', async () => {
            await addProduct(products[0]);
            const res = await request(app)
                .post(`${routePath}/carts`)
                .send({model: "iPhone13"})
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        });

        test('Should fail if product is not available', async () => {
            const productToSell = new Product(799.90, "iphone", Category.LAPTOP, "2022-01-01", "test on Laptop", 1);
            await registerProducts(productToSell);
            await sellProduct(productToSell, {quantity: 1})
            const res = await request(app)
                .post(`${routePath}/carts`)
                .send(productToSell)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(409);
        });

    })

    describe('PATCH /carts', () => {
        test('Should checkout the cart', async () => {
            await clearCarts()
            await addProduct(products[0]);


            const res = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
        })

        test('Should fail to checkout if there is no products in the cart', async () => {
            const res = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        })

        test('Should fail if one product is not available', async () => {
            await addProduct(products[0]);
            await addProduct(products[1]);
            await sellProduct(products[0], {quantity: 9});

            const res = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(409);
        })

        test('Should fail if one product requested quantity is higher than the stock', async () => {
            await addProduct(products[3]);
            await addProduct(products[3]);
            await addProduct(products[3]);
            await addProduct(products[3]);
            await addProduct(products[3]);
            await addProduct(products[3]);
            await addProduct(products[3]);

            const res = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(409);
        })

        test('Should fail if is a admin', async () => {
            const res = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(401);
        })

        test('Should fail if is a manager', async () => {
            const res = await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(401);
        })

    })

    describe('GET /carts/history', () => {
        test('Should return the cart history', async () => {
            await clearCarts()
            await addProduct(products[1]);
            await addProduct(products[2]);
            await addProduct(products[3]);
            await addProduct(products[4]);
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            const res = await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('total');
            expect(res.body[0].total).toBe(3699.6);
            expect(res.body[0]).toHaveProperty('customer');
            expect(res.body[0].customer).toBe(customer.username);
            expect(res.body[0]).toHaveProperty('paid');
            expect(res.body[0].paid).toBe(1);
            expect(res.body[0]).toHaveProperty('paymentDate');
            expect(res.body[0].paymentDate).not.toBe(null);
            expect(res.body[0]).toHaveProperty('products');
            expect(res.body[0].products).toHaveLength(4);
        })

        test('Should return multiple cart history', async () => {
            await clearCarts()
            await addProduct(products[1]);
            await addProduct(products[2]);
            await addProduct(products[3]);
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            await addProduct(products[1]);
            await addProduct(products[2]);
            await addProduct(products[3]);
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            const res = await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        })

        test('Should fail if is a admin', async () => {
            const res = await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(401);
        })

        test('Should fail if is a manager', async () => {
            const res = await request(app)
                .get(`${routePath}/carts/history`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(401);
        })

    })

    describe('DELETE /carts/products/:model', () => {
        test('Should remove a product from the cart', async () => {
            await clearCarts()
            await addProduct(products[1]);

            const res = await request(app)
                .delete(`${routePath}/carts/products/${products[1].model}`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
        })

        test('Should fail to remove if the product is not in the cart', async () => {
            await addProduct(products[1]);
            const res = await request(app)
                .delete(`${routePath}/carts/products/${products[4].model}`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        })

        test('Should fail if the cart is empty', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts/products/${products[0].model}`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(404);
        })

        test('Should fail if is a admin', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts/products/${products[0].model}`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(401);
        })

        test('Should fail if is a manager', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts/products/${products[0].model}`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(401);
        })

    })

    describe('DELETE /carts/current', () => {
        test('Should clear the cart', async () => {
            await clearCarts()
            await addProduct(products[1]);

            const res = await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(200);
        })

        test('Should fail if is a admin', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(401);
        })

        test('Should fail if is a manager', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts/current`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(401);
        })

    })

    describe('DELETE /carts', () => {
        test('Should clear the carts as an admin', async () => {
            await clearCarts()

            await addProduct(products[1]);

            const res = await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
        })

        test('Should clear the carts as a manager', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(200);
        })

        test('Should fail if is a customer', async () => {
            const res = await request(app)
                .delete(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(401);
        })

    })

    describe('GET /carts/all', () => {
        test('Should return all carts as an admin', async () => {
            await clearCarts()
            await addProduct(products[1]);
            await addProduct(products[2]);
            await addProduct(products[3]);
            await addProduct(products[4]);
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            const res = await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', adminCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('total');
            expect(res.body[0].total).toBe(3699.6);
            expect(res.body[0]).toHaveProperty('customer');
            expect(res.body[0].customer).toBe(customer.username);
            expect(res.body[0]).toHaveProperty('paid');
            expect(res.body[0].paid).toBe(1);
            expect(res.body[0]).toHaveProperty('paymentDate');
            expect(res.body[0].paymentDate).not.toBe(null);
            expect(res.body[0]).toHaveProperty('products');
            expect(res.body[0].products).toHaveLength(4);
        })

        test('Should return all carts as a manager', async () => {
            await clearCarts()
            await addProduct(products[1]);
            await addProduct(products[2]);
            await addProduct(products[3]);
            await addProduct(products[4]);
            await request(app)
                .patch(`${routePath}/carts`)
                .set('Cookie', customerCookie);

            const res = await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', managerCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('total');
            expect(res.body[0].total).toBe(3699.6);
            expect(res.body[0]).toHaveProperty('customer');
            expect(res.body[0].customer).toBe(customer.username);
            expect(res.body[0]).toHaveProperty('paid');
            expect(res.body[0].paid).toBe(1);
            expect(res.body[0]).toHaveProperty('paymentDate');
            expect(res.body[0].paymentDate).not.toBe(null);
            expect(res.body[0]).toHaveProperty('products');
            expect(res.body[0].products).toHaveLength(4);
        })

        test('Should fail if is a customer', async () => {
            const res = await request(app)
                .get(`${routePath}/carts/all`)
                .set('Cookie', customerCookie);

            expect(res.status).toBe(401);
        })

    })

});