import ProductController, { HttpError } from "../../src/controllers/productController";
import ProductDAO from "../../src/dao/productDAO";
import {
    EmptyProductStockError,
    LowProductStockError,
    ProductAlreadyExistsError,
    ProductNotFoundError
} from "../../src/errors/productError";
import {Category, Product} from "../../src/components/product";
import {DateError} from "../../src/utilities";

jest.mock('../../src/dao/productDAO');

describe('ProductController', () => {
    let productController: ProductController;
    let mockProductDAO: jest.Mocked<ProductDAO>;

    beforeEach(() => {
        productController = new ProductController();
        mockProductDAO = new ProductDAO() as jest.Mocked<ProductDAO>;
        (productController as any).dao = mockProductDAO;
        jest.clearAllMocks();
    });

    describe('registerProducts', () => {
        test('should register a new product successfully', async () => {
            mockProductDAO.getProducts.mockResolvedValue([]);
            mockProductDAO.registerProducts.mockResolvedValue(undefined);

            const model = 'TestModel';
            const category = 'Smartphone' as Category;
            const quantity = 10;
            const details = 'Some details';
            const sellingPrice = 100;
            const arrivalDate = '2023-01-01';

            await productController.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate);

            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
            expect(mockProductDAO.registerProducts).toHaveBeenCalledWith(model, category, quantity, details, sellingPrice, arrivalDate);
        });

        test('should throw ProductAlreadyExistsError if the product already exists', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const category = 'Smartphone' as Category;
            const quantity = 10;
            const details = 'Some details';
            const sellingPrice = 100;
            const arrivalDate = '2023-01-01';

            try {
                await productController.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate);
                fail('Expected to throw ProductAlreadyExistsError');
            } catch (error) {
                expect(error).toBeInstanceOf(ProductAlreadyExistsError);
            }
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
        });

        test('should throw HttpError if the arrival date is in the future with 400 status code', async () => {
            const model = 'TestModel';
            const category = 'Smartphone' as Category;
            const quantity = 10;
            const details = 'Some details';
            const sellingPrice = 100;
            const arrivalDate = '2100-01-01';

            try {
                await productController.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate);
                fail('Expected to throw HttpError');
            } catch (error) {
                expect(error).toBeInstanceOf(DateError);
                expect(error.customCode).toBe(400);
            }
        });
    });

    describe('changeProductQuantity', () => {
        test('should change the quantity of a product successfully', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);
            mockProductDAO.changeProductQuantity.mockResolvedValue(20);

            const model = 'TestModel';
            const newQuantity = 10;
            const changeDate = '2023-01-01';

            const result = await productController.changeProductQuantity(model, newQuantity, changeDate);

            expect(result).toBe(20);
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
            expect(mockProductDAO.changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate);
        });

        test('should throw ProductNotFoundError if the product is not found', async () => {
            mockProductDAO.getProducts.mockResolvedValue([]);

            const model = 'TestModel';
            const newQuantity = 10;
            const changeDate = '2023-01-01';

            try {
                await productController.changeProductQuantity(model, newQuantity, changeDate);
                fail('Expected to throw ProductNotFoundError');
            } catch (error) {
                expect(error).toBeInstanceOf(ProductNotFoundError);
            }
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
        });

        test('should throw HttpError if the change date is in the future', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const newQuantity = 10;
            const changeDate = '2100-01-01';

            try {
                await productController.changeProductQuantity(model, newQuantity, changeDate);
                fail('Expected to throw HttpError');
            } catch (error) {
                expect(error).toBeInstanceOf(DateError);
                expect(error.customCode).toBe(400);
            }
        });

        test('should throw HttpError if the change date is before the arrival date', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const newQuantity = 10;
            const changeDate = '2021-01-01';

            try {
                await productController.changeProductQuantity(model, newQuantity, changeDate);
                fail('Expected to throw HttpError');
            } catch (error) {
                expect(error).toBeInstanceOf(DateError);
                expect(error.customCode).toBe(400);
            }
        });
    });

    describe('sellProduct', () => {
        test('should sell a product successfully', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);
            mockProductDAO.sellProduct.mockResolvedValue(5);

            const model = 'TestModel';
            const quantity = 5;
            const sellingDate = '2023-01-01';

            const result = await productController.sellProduct(model, quantity, sellingDate);

            expect(result).toBe(5);
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
            expect(mockProductDAO.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate);
        });

        test('should throw ProductNotFoundError if the product is not found', async () => {
            mockProductDAO.getProducts.mockResolvedValue([]);

            const model = 'TestModel';
            const quantity = 5;
            const sellingDate = '2023-01-01';

            try {
                await productController.sellProduct(model, quantity, sellingDate);
                fail('Expected to throw ProductNotFoundError');
            } catch (error) {
                expect(error).toBeInstanceOf(ProductNotFoundError);
            }
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
        });

        test('should throw HttpError if the selling date is in the future', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const quantity = 5;
            const sellingDate = '2100-01-01';

            try {
                await productController.sellProduct(model, quantity, sellingDate);
                fail('Expected to throw HttpError');
            } catch (error) {
                expect(error).toBeInstanceOf(DateError);
                expect(error.customCode).toBe(400);
            }
        });

        test('should throw HttpError if the selling date is before the arrival date', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const quantity = 5;
            const sellingDate = '2021-01-01';

            try {
                await productController.sellProduct(model, quantity, sellingDate);
                fail('Expected to throw DateError');
            } catch (error) {
                expect(error).toBeInstanceOf(DateError);
                expect(error.customCode).toBe(400);
            }
        });

        test('should throw LowProductStockError if the quantity to sell is greater than the available quantity', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 5)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const quantity = 10;
            const sellingDate = '2023-01-01';

            try {
                await productController.sellProduct(model, quantity, sellingDate);
                fail('Expected to throw LowProductStockError');
            } catch (error) {
                expect(error).toBeInstanceOf(LowProductStockError);
            }
        })

        test('should throw EmptyProductStockError if the product stock is empty', async () => {
            const existingProduct = new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 0)
            mockProductDAO.getProducts.mockResolvedValue([existingProduct]);

            const model = 'TestModel';
            const quantity = 5;
            const sellingDate = '2023-01-01';

            try {
                await productController.sellProduct(model, quantity, sellingDate);
                fail('Expected to throw EmptyProductStockError');
            } catch (error) {
                expect(error).toBeInstanceOf(EmptyProductStockError);
            }
        })
    });

    describe('getProducts', () => {
        test('should get all products successfully', async () => {
            const grouping = '';
            const category = '';
            const model = '';

            await expect(productController.getProducts(grouping, category, model)).rejects.toThrow(HttpError);
        });

        test('should return products when valid parameters are passed', async () => {
            const mockProducts = [new Product(100, 'Model1', Category.SMARTPHONE, '2022-01-01', 'Details1', 10)];
            mockProductDAO.getProducts.mockResolvedValue(mockProducts);

            const products = await productController.getProducts('category', 'Smartphone', null);
            expect(products).toEqual(mockProducts);
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('category', 'Smartphone', null);
        });

        test('should throw an error when invalid parameters are passed', async () => {
            await expect(productController.getProducts('invalid', null, null)).rejects.toThrow(HttpError);
            await expect(productController.getProducts('category', 'invalid', null)).rejects.toThrow(HttpError);
            await expect(productController.getProducts('model', null, '')).rejects.toThrow(HttpError);
            await expect(productController.getProducts(null, 'Smartphone', null)).rejects.toThrow(HttpError);
        });

        test('should throw an error when no products are found', async () => {
            mockProductDAO.getProducts.mockResolvedValue([]);
            await expect(productController.getProducts('model', null, 'Model1')).rejects.toThrow(ProductNotFoundError);
        });
    });

    describe('getAvailableProducts', () => {
        test('should get all available products successfully', async () => {
            const grouping = '';
            const category = '';
            const model = '';

            await expect(productController.getAvailableProducts(grouping, category, model)).rejects.toThrow(HttpError);
        });

        test('should return available products when valid parameters are passed', async () => {
            const mockProducts = [new Product(100, 'Model1', Category.SMARTPHONE, '2022-01-01', 'Details1', 10)];
            mockProductDAO.getAvailableProducts.mockResolvedValue(mockProducts);

            const products = await productController.getAvailableProducts('category', 'Smartphone', null);
            expect(products).toEqual(mockProducts);
            expect(mockProductDAO.getAvailableProducts).toHaveBeenCalledWith('category', 'Smartphone', null);
        });

        test('should throw an error when invalid parameters are passed', async () => {
            await expect(productController.getAvailableProducts('invalid', null, null)).rejects.toThrow(HttpError);
            await expect(productController.getAvailableProducts('category', 'invalid', null)).rejects.toThrow(HttpError);
            await expect(productController.getAvailableProducts('model', null, '')).rejects.toThrow(HttpError);
            await expect(productController.getAvailableProducts(null, 'Smartphone', null)).rejects.toThrow(HttpError);
        });

        test('should throw an error when no products are found', async () => {
            mockProductDAO.getAvailableProducts.mockResolvedValue([]);
            mockProductDAO.getProducts.mockResolvedValue([new Product(100, 'Model1', Category.SMARTPHONE, '2022-01-01', 'Details1', 0)]);
            const p = await productController.getAvailableProducts('model', null, 'Model1')
            expect(p).toEqual([]);
        });
    });

    describe('deleteAllProducts', () => {
        test('should delete all products successfully', async () => {
            mockProductDAO.deleteAllProducts.mockResolvedValue(true);

            await productController.deleteAllProducts();

            expect(mockProductDAO.deleteAllProducts).toHaveBeenCalled();
        });
    });

    describe('deleteProduct', () => {
        test('should delete a product successfully', async () => {
            const existingProduct = [new Product(100, 'TestModel', Category.SMARTPHONE, '2022-01-01', 'Some details', 10)];
            mockProductDAO.getProducts.mockResolvedValue(existingProduct);
            mockProductDAO.deleteProduct.mockResolvedValue(true);

            const model = 'TestModel';

            await productController.deleteProduct(model);

            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
            expect(mockProductDAO.deleteProduct).toHaveBeenCalledWith(model);
        });

        test('should throw ProductNotFoundError if the product is not found', async () => {
            mockProductDAO.getProducts.mockResolvedValue([]);

            const model = 'TestModel';

            try {
                await productController.deleteProduct(model);
                fail('Expected to throw ProductNotFoundError');
            } catch (error) {
                expect(error).toBeInstanceOf(ProductNotFoundError);
            }
            expect(mockProductDAO.getProducts).toHaveBeenCalledWith('model', null, model);
        });
    });
});