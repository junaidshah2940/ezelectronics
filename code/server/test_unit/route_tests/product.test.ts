import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
// @ts-ignore
import request from 'supertest'
import { app } from "../../index"

import ProductController from "../../src/controllers/productController";
import Authenticator from "../../src/routers/auth"
import {Category, Product} from "../../src/components/product";
const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

let products = [
    new Product(799.90, "Huawei Matebook", Category.LAPTOP, "2022-01-01", "test on Laptop", 1),
    new Product(699.90, "Samsung Galaxy S21", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 2),
    new Product(299.90, "Samsung Galaxy A12", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 9),
]


describe("Product Route", () => {
    describe("POST /products/", () => {
        test("It should register products and return a 200 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
        })

        test("It should register products without the arrival date and return a 200 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: ""
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
        })

        test("It should fail to register a product (missing model) and return a 422 status code", async () => {
            const input = {
                model: "",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (wrong category) and return a 422 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "random category",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (negative quantity) and return a 422 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: -3,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (negative selling price) and return a 422 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: -699.90,
                arrivalDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (invalid arrival date) and return a 422 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022-01-32"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (invalid arrival date format) and return a 422 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022/01/01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product, api called by a non-admin user and return a 401 status code", async () => {
            const input = {
                model: "Samsung Galaxy S21",
                category: "Smartphone",
                quantity: 10,
                details: "test on Smartphone",
                sellingPrice: 699.90,
                arrivalDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                res.status(401).json({ error: "User is not an admin or manager", status: 401 })
            })

            const response = await request(app).post(baseURL + "/products").send(input)
            expect(response.status).toBe(401)
        })
    })

    describe("PATCH /products/:model", () => {
        test("It should update the quantity of a product and return a 200 status code", async () => {
            const input = {
                quantity: 20
            }
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(22)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy S21").send(input)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
        })

        test("It should fail to update the quantity of a product (negative quantity) and return a 422 status code", async () => {
            const input = {
                quantity: -20
            }
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(22)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy S21").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to update the quantity of a product (invalid quantity) and return a 422 status code", async () => {
            const input = {
                quantity: "twenty"
            }
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(22)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy S21").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (invalid arrival date) and return a 422 status code", async () => {
            const input = {
                quantity: 20,
                changeDate: "2022-01-32"
            }
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(22)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy S21").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to register a product (invalid arrival date format) and return a 422 status code", async () => {
            const input = {
                quantity: 20,
                changeDate: "2022/01/01"
            }
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(22)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy S21").send(input)
            expect(response.status).toBe(422)
        })
    })

    describe("PATCH /products/:model/sell", () => {
        test("It should sell a product and return the new quantity", async () => {
            const input = {
                quantity: 2,
                sellingDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(7)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy A12/sell").send(input)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
        })

        test("It should fail to sell a product (negative quantity) and return a 422 status code", async () => {
            const input = {
                quantity: -2,
                sellingDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(7)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy A12/sell").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to sell a product (invalid quantity) and return a 422 status code", async () => {
            const input = {
                quantity: "two",
                sellingDate: "2022-01-01"
            }
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(7)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy A12/sell").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to sell a product (invalid selling date) and return a 422 status code", async () => {
            const input = {
                quantity: 2,
                sellingDate: "2022-01-32"
            }
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(7)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy A12/sell").send(input)
            expect(response.status).toBe(422)
        })

        test("It should fail to sell a product (invalid selling date format) and return a 422 status code", async () => {
            const input = {
                quantity: 2,
                sellingDate: "2022/01/01"
            }
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(7)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/products/Samsung Galaxy A12/sell").send(input)
            expect(response.status).toBe(422)
        })
    })

    describe("GET /products", () => {
        test("It should return an array of products", async () => {
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        })

        test("It should return an array of products with a specified category", async () => {
            const query = {grouping: "category", category: "Laptop", model: ""}
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products").query(query)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        })

        test("It should return an array of products with a specified model", async () => {
            const query = {grouping: "model", category: "", model: "Samsung Galaxy S21"}
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products").query(query)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        })
    })

    describe("GET /products/available", () => {
        test("It should return an array of available products", async () => {
            const query = {grouping: "", category: "", model: ""}
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products/available").query(query)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })

        test("It should return an array of available products with a specified category", async () => {
            const query = {grouping: "category", category: "Laptop", model: ""}
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products/available").query(query)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })

        test("It should return an array of available products with a specified model", async () => {
            const query = {grouping: "model", category: "", model: "Samsung Galaxy S21"}
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(products)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/products/available").query(query)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled()
        })
    })

    describe("DELETE /products/", () => {
        test("It should delete all products and return a 200 status code", async () => {
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled()
        })
    })

    describe("DELETE /products/:model", () => {
        test("It should delete a product and return a 200 status code", async () => {
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/products/Samsung Galaxy S21")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
        })

        test("It should fail to delete a product (product not found) and return a 404 status code", async () => {
            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce({customMessage: "Product not found", customCode: 404})
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/products/Samsung Galaxy S21")
            expect(response.status).toBe(404)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
        })
    })
})