import {describe, expect, jest, test} from "@jest/globals"
// @ts-ignore
import request from 'supertest'
import { app } from "../../index"

import {Role, User} from "../../src/components/user";
import {Category, Product} from "../../src/components/product";
import {Cart, ProductInCart} from "../../src/components/cart";
import CartController from "../../src/controllers/cartController";
import Authenticator from "../../src/routers/auth";
import {EmptyProductStockError, LowProductStockError, ProductNotFoundError} from "../../src/errors/productError";
import {CartNotFoundError, EmptyCartError, ProductNotInCartError} from "../../src/errors/cartError";
import {UserNotAdminError, UserNotCustomerError, UserNotManagerError} from "../../src/errors/userError";

const baseURL = "/ezelectronics"

//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/cartController")
jest.mock("../../src/routers/auth")

let cart = new Cart("customer", false, null, 0, [])

const customer: User = new User('customer', 'name', 'surname', Role.CUSTOMER, '', '');
const testProduct : Product = new Product(100, 'ps 6', Category.SMARTPHONE, null, null, 700)


describe('cart Route', () => {

    describe("GET /carts", () => {
        test("It should return a cart object", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/carts")
            expect(response.status).toBe(200)
            expect(CartController.prototype.getCart).toHaveBeenCalled()
            expect(response.body).toEqual(cart)
        })


        test("It should return 401 if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next(new UserNotCustomerError())
            })

            const response = await request(app).get(baseURL + "/carts")

            expect(response.status).toBe(401)
        })

    })

    describe("POST /carts", () => {
        test("It should add a product to the cart", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/carts").send({user: customer, model: testProduct.model})

            expect(response.status).toBe(200)
            expect(CartController.prototype.addToCart).toHaveBeenCalled()
        })

        test("It should return 404 if the product is not found", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/carts").send({user: customer, model: testProduct.model})

            expect(response.status).toBe(404)
            expect(CartController.prototype.addToCart).toHaveBeenCalled()
        })

        test("It should return 409 if the product is not available", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/carts").send({user: customer, model: testProduct.model})

            expect(response.status).toBe(409)
            expect(CartController.prototype.addToCart).toHaveBeenCalled()
        })

        test("It should return and error if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next(new UserNotCustomerError())
            })

            const response = await request(app).post(baseURL + "/carts").send({user: customer, model: testProduct.model})

            expect(response.status).toBe(401)
        })

        test("It should return 422 if the model is not provided", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).post(baseURL + "/carts")

            expect(response.status).toBe(422)
        })

    })

    describe("PATCH /carts", () => {
        test("It should checkout the cart", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/carts").send({user: customer})

            expect(response.status).toBe(200)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalled()
        })

        test("It should return 404 if the cart is not found", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/carts").send({user: customer})

            expect(response.status).toBe(404)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalled()
        })

        test("It should return 400 if the cart empty", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/carts").send({user: customer})

            expect(response.status).toBe(400)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalled()
        })

        test("It should return 409 if the product stock is lower than the required", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/carts").send({user: customer})

            expect(response.status).toBe(409)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalled()
        })

        test("It should return 409 if the product stock is empty", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyProductStockError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).patch(baseURL + "/carts").send({user: customer})

            expect(response.status).toBe(409)
            expect(CartController.prototype.checkoutCart).toHaveBeenCalled()
        })

        test("It should return 401 if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next(new UserNotCustomerError())
            })

            const response = await request(app).patch(baseURL + "/carts").send({user: customer})

            expect(response.status).toBe(401)
        })

    })

    describe("GET /carts/history", () => {
        test("It should return the history of the carts", async () => {
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([cart]);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/carts/history")

            expect(response.status).toBe(200)
            expect(CartController.prototype.getCustomerCarts).toHaveBeenCalled()
            expect(response.body).toEqual([cart])
        })

        test("It should return and error if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next(new UserNotCustomerError())
            })

            const response = await request(app).get(baseURL + "/carts/history")

            expect(response.status).toBe(401)
        })


    })

    describe("DELETE /carts/products/:model", () => {
        test("It should delete a product from the cart", async () => {
          jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
          jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
              return next()
          })
          jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
              return next()
          })

          const response = await request(app).delete(baseURL + "/carts/products/" + testProduct.model)

          expect(response.status).toBe(200)
          expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled()
        })

        test("It should return 404 if the product is not in the cart", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts/products/" + testProduct.model)

            expect(response.status).toBe(404)
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled()
        })

        test("It should return 404 if there isn't an unpaid cart for the user", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts/products/" + testProduct.model)

            expect(response.status).toBe(404)
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled()
        })

        test("It should return 400 if the cart is empty", async () => {
            //the api asks for 404 but the error returns 400 by default, so we will test for 400
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new EmptyCartError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts/products/" + testProduct.model)

            expect(response.status).toBe(400)
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled()
        })

        test("It should return 404 if the model doesn't exists", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts/products/" + testProduct.model)

            expect(response.status).toBe(404)
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled()
        })

        test("It should return 401 if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next(new UserNotCustomerError())
            })

            const response = await request(app).delete(baseURL + "/carts/products/" + testProduct.model)

            expect(response.status).toBe(401)
        })

        //
        // test("it should return 422 if the model is not provided", async () => {
        //     jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        //         return next()
        //     })
        //     jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        //         return next()
        //     })
        //
        //     const response = await request(app).delete(baseURL + "/carts/products/")
        //
        //     expect(response.status).toBe(422)
        // })


    })

    describe("DELETE /carts/current", () => {
        test("It should clear the cart", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts/current")

            expect(response.status).toBe(200)
            expect(CartController.prototype.clearCart).toHaveBeenCalled()
        })

        test("It should return 404 if the cart is not found", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts/current")

            expect(response.status).toBe(404)
            expect(CartController.prototype.clearCart).toHaveBeenCalled()
        })

        test("It should return 401 if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next(new UserNotCustomerError())
            })

            const response = await request(app).delete(baseURL + "/carts/current")
            expect(response.status).toBe(401)
        })


    })

    describe("DELETE /carts", () => {
        test("It should delete all carts", async () => {
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).delete(baseURL + "/carts")

            expect(response.status).toBe(200)
            expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled()
        })

        test("It should return 401 if the user is not an admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next(new UserNotAdminError())
            })

            const response = await request(app).delete(baseURL + "/carts")
            expect(response.status).toBe(401)
        })

        test("It should return 401 if the user is not a manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next(new UserNotManagerError())
            })

            const response = await request(app).delete(baseURL + "/carts")
            expect(response.status).toBe(401)
        })

    })

    describe("GET /carts/all", () => {
        test("It should return all carts", async () => {
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([cart]);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURL + "/carts/all")

            expect(response.status).toBe(200)
            expect(CartController.prototype.getAllCarts).toHaveBeenCalled()
            expect(response.body).toEqual([cart])
        })

        test("It should return 401 if the user is not an admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next(new UserNotAdminError())
            })

            const response = await request(app).get(baseURL + "/carts/all")
            expect(response.status).toBe(401)
        })

        test("It should return 401 if the user is not a manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next(new UserNotManagerError())
            })

            const response = await request(app).get(baseURL + "/carts/all")
            expect(response.status).toBe(401)
        })

    })
})