import CartController from "../../src/controllers/cartController";
import CartDAO  from "../../src/dao/cartDAO";
import { Cart, ProductInCart } from "../../src/components/cart";
import {Category, Product} from "../../src/components/product";
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError";
import {
    CartNotFoundError,
    ProductNotInCartError,
} from "../../src/errors/cartError";
import {Role, User} from "../../src/components/user";


jest.mock("../../src/dao/cartDAO");

describe('CartController', () => {
    let cartController: CartController;
    let mockCartDAO: jest.Mocked<CartDAO>;


    let customer: User = new User('customer', 'name', 'surname', Role.CUSTOMER, '', '');
    let testProduct: Product = new Product(100, 'ps 6', Category.SMARTPHONE, null, null, 700)
    let testCart: Cart = new Cart(customer.username, false, null, 0, []);
    let productInCart: ProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice);


    beforeEach(() => {
        cartController = new CartController();
        mockCartDAO = new CartDAO() as jest.Mocked<CartDAO>;
        (cartController as any).dao1 = mockCartDAO;
        jest.clearAllMocks();
    });

    describe('getCart', () => {
        test('Should return the cart of the logged in customer', async () => {
            mockCartDAO.getCart.mockResolvedValue(testCart);

            const cart = await cartController.getCart(customer);

            expect(cart).toEqual(testCart);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
        });

        test('Should throw an error if the cart is not found', async () => {
            mockCartDAO.getCart.mockRejectedValue(new CartNotFoundError());

            await expect(cartController.getCart(customer)).rejects.toThrow(CartNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
        })

    });

    describe('addToCart', () => {
        test('Should increase the quantity of a product already into the cart of a logged in customer', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.updateCart.mockResolvedValue(true);

            const result = await cartController.addToCart(customer, testProduct.model);

            expect(result).toBe(true)
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.updateCart).toHaveBeenCalledWith(customer, testProduct.model, 1);
            testCart.products.pop()
        });

        test("Should add a product to the cart of a logged in customer", async () => {
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.insertCart.mockResolvedValue(true);

            const result = await cartController.addToCart(customer, testProduct.model);

            expect(result).toBe(true)
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.insertCart).toHaveBeenCalledWith(customer, testProduct.model);
        })

        test('Should throw an error if the product is not available', async () => {
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockRejectedValue(new ProductNotFoundError());

            await expect(cartController.addToCart(customer, testProduct.model)).rejects.toThrow(ProductNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
        });

        test('Should throw an error if the product cannot be updated', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.updateCart.mockRejectedValue(new Error());

            await expect(cartController.addToCart(customer, testProduct.model)).rejects.toThrow(Error);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.updateCart).toHaveBeenCalledWith(customer, testProduct.model, 1);
            testCart.products.pop()
        })

        test('Should throw an error if the product cannot be inserted', async () => {
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.insertCart.mockRejectedValue(new Error());

            await expect(cartController.addToCart(customer, testProduct.model)).rejects.toThrow(Error);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.insertCart).toHaveBeenCalledWith(customer, testProduct.model);
        })

    })

    describe('checkoutCart', () => {
        test('Should checkout the cart of a logged in customer', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.updateQuantity.mockResolvedValue(true);
            mockCartDAO.checkoutCart.mockResolvedValue(true);

            const result = await cartController.checkoutCart(customer);

            expect(result).toBe(true)
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.updateQuantity).toHaveBeenCalledWith(testProduct.model, 1);
            expect(mockCartDAO.checkoutCart).toHaveBeenCalledWith(customer);
            testCart.products.pop()
        })

        test('Should throw an error if the cart is empty', async () => {
            mockCartDAO.getCart.mockResolvedValue(testCart);

            await expect(cartController.checkoutCart(customer)).rejects.toThrow(CartNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
        })

        test('Should throw an error if the product is not available', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockRejectedValue(new ProductNotFoundError());

            await expect(cartController.checkoutCart(customer)).rejects.toThrow(ProductNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            testCart.products.pop()
        })

        test('Should throw an error if the product quantity cannot be updated', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.updateQuantity.mockRejectedValue(new Error());

            await expect(cartController.checkoutCart(customer)).rejects.toThrow(Error);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.updateQuantity).toHaveBeenCalledWith(testProduct.model, 1);
            testCart.products.pop()
        })

        test('Should throw an error if the cart cannot be checked out', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.updateQuantity.mockResolvedValue(true);
            mockCartDAO.checkoutCart.mockRejectedValue(new Error());

            await expect(cartController.checkoutCart(customer)).rejects.toThrow(Error);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.updateQuantity).toHaveBeenCalledWith(testProduct.model, 1);
            expect(mockCartDAO.checkoutCart).toHaveBeenCalledWith(customer);
            testCart.products.pop()
        })

        test('Should throw an error if the product quantity is lower than the requested quantity', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(new Product(100, 'ps 6', Category.SMARTPHONE, null, null, 0));
            mockCartDAO.updateQuantity.mockResolvedValue(true);

            await expect(cartController.checkoutCart(customer)).rejects.toThrow(LowProductStockError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            testCart.products.pop()
        })

        test('Should throw an error if the product stock is empty', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockRejectedValue(new EmptyProductStockError());
            mockCartDAO.updateQuantity.mockResolvedValue(true);

            await expect(cartController.checkoutCart(customer)).rejects.toThrow(EmptyProductStockError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            testCart.products.pop()
        })

    })

    describe('getCustomerCarts', () => {
        test('Should return the history of the logged in customer carts', async () => {
            mockCartDAO.getCartsID.mockResolvedValue([1]);
            mockCartDAO.getCartProducts.mockResolvedValue(testCart);

            const carts = await cartController.getCustomerCarts(customer);

            expect(carts).toEqual([testCart]);
            expect(mockCartDAO.getCartsID).toHaveBeenCalledWith(customer, true);
            expect(mockCartDAO.getCartProducts).toHaveBeenCalledWith(customer.username, 1);
        })

        test('Should throw an error if the carts are not found', async () => {
            mockCartDAO.getCartsID.mockRejectedValue(new Error());

            await expect(cartController.getCustomerCarts(customer)).rejects.toThrow(Error);
            expect(mockCartDAO.getCartsID).toHaveBeenCalledWith(customer, true);
        })

        test('Should throw an error if one product in the cart is not found', async () => {
            mockCartDAO.getCartsID.mockResolvedValue([1]);
            mockCartDAO.getCartProducts.mockRejectedValue(new Error());

            await expect(cartController.getCustomerCarts(customer)).rejects.toThrow(Error);
            expect(mockCartDAO.getCartsID).toHaveBeenCalledWith(customer, true);
            expect(mockCartDAO.getCartProducts).toHaveBeenCalledWith(customer.username, 1);
        })

    })

    describe('removeProductFromCart', () => {
        test('Should remove a product from the cart of a logged in customer', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.removeFromCart.mockResolvedValue(true);

            const result = await cartController.removeProductFromCart(customer, testProduct.model);

            expect(result).toBe(true);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.removeFromCart).toHaveBeenCalledWith(customer, testProduct.model);
            testCart.products.pop()
        })

        test('Should throw an error if the cart is empty', async () => {
            mockCartDAO.getCart.mockResolvedValue(testCart);

            await expect(cartController.removeProductFromCart(customer, testProduct.model)).rejects.toThrow(CartNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
        })

        test('Should throw an error if the cart is not found', async () => {
            mockCartDAO.getCart.mockRejectedValue(new CartNotFoundError());

            await expect(cartController.removeProductFromCart(customer, testProduct.model)).rejects.toThrow(CartNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
        })

        test('Should throw an error if the product is not in the cart', async () => {
            testCart.products.push(new ProductInCart('model', 1, Category.SMARTPHONE, 700))
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);

            await expect(cartController.removeProductFromCart(customer, testProduct.model)).rejects.toThrow(ProductNotInCartError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            testCart.products.pop()
        })

        test('Should throw an error if the product is not available', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockRejectedValue(new ProductNotFoundError());

            await expect(cartController.removeProductFromCart(customer, testProduct.model)).rejects.toThrow(ProductNotFoundError);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            testCart.products.pop()
        })

        test('Should throw an error if the product cannot be removed', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCart.mockResolvedValue(testCart);
            mockCartDAO.checkProduct.mockResolvedValue(testProduct);
            mockCartDAO.removeFromCart.mockRejectedValue(new Error());

            await expect(cartController.removeProductFromCart(customer, testProduct.model)).rejects.toThrow(Error);
            expect(mockCartDAO.getCart).toHaveBeenCalledWith(customer);
            expect(mockCartDAO.checkProduct).toHaveBeenCalledWith(testProduct.model);
            expect(mockCartDAO.removeFromCart).toHaveBeenCalledWith(customer, testProduct.model);
            testCart.products.pop()
        })


    })

    describe('clearCart', () => {
        test('Should empty the cart of a user', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCartsID.mockResolvedValue([1]);
            mockCartDAO.getCartProducts.mockResolvedValue(testCart)
            mockCartDAO.clearCart.mockResolvedValue(true);

            const result = await cartController.clearCart(customer);

            expect(result).toBe(true);
            expect(mockCartDAO.getCartsID).toHaveBeenCalledWith(customer, false);
            expect(mockCartDAO.getCartProducts).toHaveBeenCalledWith(customer.username, 1);
            expect(mockCartDAO.clearCart).toHaveBeenCalledWith(1);
            testCart.products.pop()
        })


        test('Should throw an error if something goes wrong during the delete', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getCartsID.mockResolvedValue([1]);
            mockCartDAO.getCartProducts.mockResolvedValue(testCart);
            mockCartDAO.clearCart.mockRejectedValue(new Error());

            await expect(cartController.clearCart(customer)).rejects.toThrow(Error);
            expect(mockCartDAO.getCartsID).toHaveBeenCalledWith(customer, false);
            expect(mockCartDAO.getCartProducts).toHaveBeenCalledWith(customer.username, 1);
            expect(mockCartDAO.clearCart).toHaveBeenCalledWith(1);
            testCart.products.pop();
        })

        test('Should throw an error if is not possible to find the cart', async () => {
            mockCartDAO.getCartsID.mockRejectedValue(new Error());

            await expect(cartController.clearCart(customer)).rejects.toThrow(Error);
            expect(mockCartDAO.getCartsID).toHaveBeenCalledWith(customer, false);
        })

    })

    describe('deleteAllCarts', () => {
        test('Should delete all carts', async () => {
            mockCartDAO.deleteAllCarts.mockResolvedValue(true);

            const result = await cartController.deleteAllCarts();

            expect(result).toBe(true);
            expect(mockCartDAO.deleteAllCarts).toHaveBeenCalled();
        })

        test('Should throw an error if something goes wrong during the delete', async () => {
            mockCartDAO.deleteAllCarts.mockRejectedValue(new Error());

            await expect(cartController.deleteAllCarts()).rejects.toThrow(Error);
            expect(mockCartDAO.deleteAllCarts).toHaveBeenCalled();
        })
    })

    describe('getAllCarts', () => {
        class Tuple {
            id: any;
            username: string;

            constructor(id: any, username: string) {
                this.id = id;
                this.username = username;
            }
        }

        test('Should return all carts', async () => {
            testCart.products.push(productInCart)
            mockCartDAO.getAllCarts.mockResolvedValue([new Tuple(1, 'customer')]);
            mockCartDAO.getCartProducts.mockResolvedValue(testCart);

            const carts = await cartController.getAllCarts();

            expect(carts).toEqual([testCart]);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
            testCart.products.pop();
        })

        test('Should throw an error if something goes wrong during the retrieval', async () => {
            mockCartDAO.getAllCarts.mockRejectedValue(new Error());

            await expect(cartController.getAllCarts()).rejects.toThrow(Error);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });

        test('Should throw an error if something goes wrong during the retrieval of the carts ids', async () => {
            mockCartDAO.getAllCarts.mockResolvedValue([new Tuple(1, 'customer')]);
            mockCartDAO.getCartProducts.mockRejectedValue(new Error());

            await expect(cartController.getAllCarts()).rejects.toThrow(Error);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });

        test('Should ignore the carts with zero products', async () => {
            mockCartDAO.getAllCarts.mockResolvedValue([new Tuple(1, 'customer'), new Tuple(2, 'customer')]);
            mockCartDAO.getCartProducts.mockResolvedValue(new Cart(customer.username, false, null, 0, []));

            const carts = await cartController.getAllCarts();
            console.log(carts)

            expect(carts).toEqual([]);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });

        test('Should throw an error if something goes wrong during the retrieval of the products', async () => {
            mockCartDAO.getAllCarts.mockResolvedValue([new Tuple(1, 'customer')]);
            mockCartDAO.getCartProducts.mockRejectedValue(new Error());

            await expect(cartController.getAllCarts()).rejects.toThrow(Error);
            expect(mockCartDAO.getAllCarts).toHaveBeenCalled();
        });

    });
})
