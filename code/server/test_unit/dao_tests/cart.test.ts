import {describe, expect, jest, test} from "@jest/globals"
import UserDAO from "../../src/dao/userDAO"
import CartDAO from "../../src/dao/cartDAO"
import db from "../../src/db/db"
import {Database} from "sqlite3"
import {Role, User} from "../../src/components/user";
import {Category, Product} from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO";
import {Cart, ProductInCart} from "../../src/components/cart";
import cartDAO from "../../src/dao/cartDAO";
import {ProductNotFoundError, EmptyProductStockError} from "../../src/errors/productError";

jest.mock("../../src/db/db")
const customer: User = new User('customer', 'name', 'surname', Role.CUSTOMER, '', '');
const testProduct : Product = new Product(100, 'ps 6', Category.SMARTPHONE, null, null, 700)
const testProduct1 : Product = new Product(1420, 'iPhone 9', Category.SMARTPHONE, null, null, 700)

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe('cartDao', () => {
    const cartDAO = new CartDAO()

    describe("get cart", () => {
        test("It should return an empty cart", async () => {
            let mockRows: { quantity: null; model: null; category: null; singleProductTotal: null }[];
            mockRows = [
                {model: null, category: null, singleProductTotal: null, quantity: null}
            ];
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });
            const cart = await cartDAO.getCart(customer)
            expect(mockAll).toHaveBeenCalledWith("SELECT P.model, P.category, P.sellingPrice as singleProductTotal, CP.quantity FROM carts C LEFT JOIN cart_product CP ON CP.cart_id = C.id LEFT JOIN products P ON P.id = CP.product_id WHERE C.paid = false AND C.customer = ?",
                [customer.username],
                expect.any(Function))
            expect(cart).toEqual(new Cart(customer.username, false, null, 0, []))
            mockAll.mockRestore()
        })

        test("It should return a cart with a product", async() => {
            const mockRows = [
                { model: testProduct.model, category: testProduct.category, singleProductTotal: 100, quantity: 1 }
            ];
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });
            const cart = await cartDAO.getCart(customer)
            expect(mockAll).toHaveBeenCalledWith("SELECT P.model, P.category, P.sellingPrice as singleProductTotal, CP.quantity FROM carts C LEFT JOIN cart_product CP ON CP.cart_id = C.id LEFT JOIN products P ON P.id = CP.product_id WHERE C.paid = false AND C.customer = ?",
                [customer.username],
                expect.any(Function))
            expect(cart).toEqual(new Cart(customer.username, false, null, testProduct.sellingPrice, [new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)]))
            mockAll.mockRestore()
        })

        test("It should give an error in the get", async () => {
            const mockError = new Error("Database error")
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });
            await expect(cartDAO.getCart(customer)).rejects.toThrow(mockError)
            mockAll.mockRestore()
        })

        test("It should give an error in the insert", async () => {
            const mockError = new Error("Database error")
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null,[])
                return {} as Database
            });
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });
            await expect(cartDAO.getCart(customer)).rejects.toThrow(mockError)
            mockAll.mockRestore()
            mockRun.mockRestore()
        })
    })

    describe("remove from cart", () => {
        test("It should remove a product from the cart", async () => {
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            await cartDAO.removeFromCart(customer, testProduct.model)
            expect(mockRun).toHaveBeenCalledWith("DELETE FROM cart_product WHERE product_id = (SELECT id FROM products WHERE model = ?) AND cart_id = (SELECT id FROM carts WHERE customer = ? AND paid = false)",
                [testProduct.model, customer.username],
                expect.any(Function))
            mockRun.mockRestore()
        })

        test("It should give an error in the remove", async () => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });
            await expect(cartDAO.removeFromCart(customer, testProduct.model)).rejects.toThrow(mockError)
            mockRun.mockRestore()
        })

    })

    describe("update cart", () =>{
        test("Add one product already into cart", async() => {
            const mockRows = [
                { id: 1, username: customer.username, paid: false, total: testProduct.sellingPrice, products: [new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)] }
            ]
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            await cartDAO.updateCart(customer, testProduct.model, 1)

            expect(mockRun).toHaveBeenCalledWith("UPDATE cart_product SET quantity = quantity + ? WHERE product_id = (SELECT id FROM products WHERE model = ?) AND cart_id = (SELECT id FROM carts WHERE customer = ? AND paid = false)",
                [1, testProduct.model, customer.username],
                expect.any(Function)
            )
            mockRun.mockRestore()
        })

        test("Error during add one product already into cart", async() => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.updateCart(customer, testProduct.model, 1)).rejects.toThrow(mockError)

            mockRun.mockRestore()
        })
    })

    describe("insert cart", () =>{
        test("Add one product not into cart", async() => {
            const mockRows = [
                { id: 1, username: customer.username, paid: false, total: testProduct.sellingPrice, products: [new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)] }
            ]
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            await cartDAO.insertCart(customer, testProduct.model)

            expect(mockRun).toHaveBeenCalledWith("INSERT INTO cart_product  (cart_id, product_id, quantity) VALUES ((SELECT id FROM carts WHERE customer = ? AND paid = false), (SELECT id FROM products WHERE model = ?), 1)",
                [customer.username, testProduct.model],
                expect.any(Function)
            )
            mockRun.mockRestore()
        })

        test("Error during add one product not into cart", async() => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.insertCart(customer, testProduct.model)).rejects.toThrow(mockError)

            mockRun.mockRestore()
        })
    })
    describe("checkout cart", () =>{
        test("Checkout cart successful", async() => {
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            await cartDAO.checkoutCart(customer)

            expect(mockRun).toHaveBeenCalledWith("UPDATE carts SET paid = true, paymentDate = ? WHERE customer = ? AND paid = false",
                [new Date().toISOString().split("T")[0], customer.username],
                expect.any(Function)
            )
            mockRun.mockRestore()
        })

        test("Error during checkout cart", async() => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.checkoutCart(customer)).rejects.toThrow(mockError)

            mockRun.mockRestore()
        })
    })

    describe("update quantity", () =>{
        test("Update quantity successful", async() => {
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            await cartDAO.updateQuantity(testProduct.model, 1)

            expect(mockRun).toHaveBeenCalledWith("UPDATE products SET quantity = quantity - ? WHERE model = ?",
                [1, testProduct.model],
                expect.any(Function)
            )
            mockRun.mockRestore()
        })

        test("Error during update quantity", async() => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.updateQuantity(testProduct.model, 2)).rejects.toThrow(mockError)

            mockRun.mockRestore()
        })
    })

    describe("get carts id", () =>{
        test("Get paid carts id successful", async() => {
            const mockRows = [
                { id: 1 }
            ]
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            const ids = await cartDAO.getCartsID(customer, true)

            expect(mockAll).toHaveBeenCalledWith("SELECT id FROM carts WHERE customer = ? AND paid = ?",
                [customer.username, true],
                expect.any(Function)
            )
            expect(ids).toEqual([1])
            mockAll.mockRestore()
        })

        test("Get unpaid carts id successful", async() => {
            const mockRows = [
                { id: 1 }
            ]
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            const ids = await cartDAO.getCartsID(customer, false)

            expect(mockAll).toHaveBeenCalledWith("SELECT id FROM carts WHERE customer = ? AND paid = ?",
                [customer.username, false],
                expect.any(Function)
            )
            expect(ids).toEqual([1])
            mockAll.mockRestore()
        })

        test("Error during get unpaid carts id", async() => {
            const mockError = new Error("Database error")
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.getCartsID(customer, false)).rejects.toThrow(mockError)

            mockAll.mockRestore()
        })

        test("Error during get paid carts id", async() => {
            const mockError = new Error("Database error")
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.getCartsID(customer, true)).rejects.toThrow(mockError)

            mockAll.mockRestore()
        })
    })

    describe("check product", () =>{
        test("Check products successful", async() => {
            const mockGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testProduct)
                return {} as Database
            });

            const products = await cartDAO.checkProduct(testProduct.model)

            expect(mockGet).toHaveBeenCalledWith("SELECT * FROM products WHERE model = ?",
                [testProduct.model],
                expect.any(Function)
            )
            expect(products).toEqual(testProduct)
            mockGet.mockRestore()
        })

        test("Error during check products", async() => {
            const mockError = new Error("Database error")
            const mockGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.checkProduct(testProduct.model)).rejects.toThrow(mockError)

            mockGet.mockRestore()
        })

        test("Check products not found", async() => {
            const mockGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            await expect(cartDAO.checkProduct(testProduct.model)).rejects.toThrow(new ProductNotFoundError())

            expect(mockGet).toHaveBeenCalledWith("SELECT * FROM products WHERE model = ?",
                [testProduct.model],
                expect.any(Function)
            )
            mockGet.mockRestore()
        })

        test("Check products empty stock", async() => {
            const mockGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, { quantity: 0 })
                return {} as Database
            });

            await expect(cartDAO.checkProduct(testProduct.model)).rejects.toThrow(new EmptyProductStockError())

            expect(mockGet).toHaveBeenCalledWith("SELECT * FROM products WHERE model = ?",
                [testProduct.model],
                expect.any(Function)
            )
            mockGet.mockRestore()
        })

    })

    describe("get products in cart", () =>{
        test("Get products in cart successful", async() => {
            const mockRows = [
                { model: testProduct.model, category: testProduct.category, singleProductTotal: testProduct.sellingPrice, paid: false, paymentDate: 'Current cart', quantity: 1 }
            ]
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            const products = await cartDAO.getCartProducts(customer.username, 1)

            expect(mockAll).toHaveBeenCalledWith("SELECT P.model, P.category, P.sellingPrice as singleProductTotal, C.paid, C.paymentDate, CP.quantity FROM carts C LEFT JOIN cart_product CP ON CP.cart_id = C.id LEFT JOIN products P ON P.id = CP.product_id WHERE C.id = ?",
                [1],
                expect.any(Function)
            )
            expect(products).toEqual(new Cart(customer.username, false, "Current cart", testProduct.sellingPrice, [new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)]))
            mockAll.mockRestore()
        })

        test("Get products in cart successful with multiple products", async() => {
            const mockRows = [
                { model: testProduct.model, category: testProduct.category, singleProductTotal: testProduct.sellingPrice, paid: true, paymentDate: '2024-06-13', quantity: 1 },
                { model: testProduct1.model, category: testProduct1.category, singleProductTotal: testProduct1.sellingPrice, paid: true, paymentDate: '2024-06-13', quantity: 1 }
            ]
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            const products = await cartDAO.getCartProducts(customer.username, 1)

            expect(mockAll).toHaveBeenCalledWith("SELECT P.model, P.category, P.sellingPrice as singleProductTotal, C.paid, C.paymentDate, CP.quantity FROM carts C LEFT JOIN cart_product CP ON CP.cart_id = C.id LEFT JOIN products P ON P.id = CP.product_id WHERE C.id = ?",
                [1],
                expect.any(Function)
            )
            expect(products).toEqual(new Cart(customer.username, true, "2024-06-13", testProduct.sellingPrice+testProduct1.sellingPrice, [new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice), new ProductInCart(testProduct1.model, 1, testProduct1.category, testProduct1.sellingPrice)]))
            mockAll.mockRestore()
        })

        test("Error during get products in cart", async() => {
            const mockError = new Error("Database error")
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.getCartProducts(customer.username, 1)).rejects.toThrow(mockError)

            mockAll.mockRestore()
        })
    })

    describe("clear cart", () =>{
        test("Clear cart successful", async() => {
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const response = await cartDAO.clearCart(1)

            expect(mockRun).toHaveBeenCalledWith("DELETE FROM cart_product WHERE cart_id = ?",
                [1],
                expect.any(Function)
            )
            expect(response).toBe(true)
            mockRun.mockRestore()
        })

        test("Error during clear cart", async() => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.clearCart(1)).rejects.toThrow(mockError)

            mockRun.mockRestore()
        })
    })
    describe("delete all carts", () =>{
        test("Delete all carts successful", async() => {
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await cartDAO.deleteAllCarts()

            expect(mockRun).toHaveBeenCalledWith("DELETE FROM cart_product",
                [],
                expect.any(Function),
            )
            expect(mockRun).toHaveBeenCalledWith("DELETE FROM carts",
                [],
                expect.any(Function),
            )
            expect(result).toBe(true)
            mockRun.mockRestore()
        })

        test("Error during delete all carts", async() => {
            const mockError = new Error("Database error")
            const mockRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.deleteAllCarts()).rejects.toThrow(mockError)

            mockRun.mockRestore()
        })
    })

    describe("get all carts", () =>{
        class Tuple {
            id: any;
            username: string;

            constructor(id: any, username: string) {
                this.id = id;
                this.username = username;
            }
        }
        test("Get all carts successful", async() => {
            const mockRows = [
                { id: 1, customer: customer.username }
            ]
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            const carts = await cartDAO.getAllCarts()

            expect(mockAll).toHaveBeenCalledWith("SELECT * FROM carts",
                [],
                expect.any(Function)
            )
            expect(carts).toEqual([new Tuple(1, customer.username)])
            mockAll.mockRestore()
        })

        test("Get all carts successful with multiple products", async() => {
            const mockRows = [
                { id: 1, customer: customer.username },
                { id: 2, customer: customer.username }
            ]
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows)
                return {} as Database
            });

            const carts = await cartDAO.getAllCarts()

            expect(mockAll).toHaveBeenCalledWith("SELECT * FROM carts",
                [],
                expect.any(Function)
            )
            expect(carts).toEqual([new Tuple(1, customer.username), new Tuple(2, customer.username)])
            mockAll.mockRestore()
        })

        test("Error during get all carts", async() => {
            const mockError = new Error("Database error")
            const mockAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            await expect(cartDAO.getAllCarts()).rejects.toThrow(mockError)

            mockAll.mockRestore()
        })
    })
})

