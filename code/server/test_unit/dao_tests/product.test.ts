import db from "../../src/db/db";
import ProductDAO from "../../src/dao/productDAO";
import {Category, Product} from "../../src/components/product";
import {beforeEach} from "@jest/globals";

// Mock the SQLite3 database
jest.mock('../../src/db/db');
describe('ProductDAO', () => {
    let productDAO: ProductDAO;
    let products = [
        new Product(799.90, "Huawei Matebook", Category.LAPTOP, "2022-01-01", "test on Laptop", 1),
        new Product(699.90, "Samsung Galaxy S21", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 2),
        new Product(299.90, "Samsung Galaxy A12", Category.SMARTPHONE, "2022-01-01", "test on Smartphone", 9),
    ];

    beforeEach(() => {
        productDAO = new ProductDAO();
        jest.clearAllMocks();
    });

    describe('registerProducts', () => {
        test('should register a new product successfully', async () => {
            const mockRun = jest.fn((sql, params, callback) => callback(null));
            (db.run as jest.Mock) = mockRun;

            const model = 'TestModel';
            const category = 'Smartphone' as Category;
            const quantity = 10;
            const details = 'Some details';
            const sellingPrice = 100;
            const arrivalDate = '2023-01-01';

            await productDAO.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate);

            expect(mockRun).toHaveBeenCalledWith(
                "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)",
                [model, category, quantity, details, sellingPrice, arrivalDate],
                expect.any(Function)
            );
        });

        test('should register a new product with default arrival date', async () => {
            const mockRun = jest.fn((sql, params, callback) => callback(null));
            (db.run as jest.Mock) = mockRun;

            const model = 'TestModel';
            const category = 'Smartphone' as Category;
            const quantity = 10;
            const details = 'Some details';
            const sellingPrice = 100;

            await productDAO.registerProducts(model, category, quantity, details, sellingPrice, null);

            expect(mockRun).toHaveBeenCalledWith(
                "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)",
                [model, category, quantity, details, sellingPrice, expect.any(String)],
                expect.any(Function)
            );
        });

        test('should reject with an error if the database operation fails', async () => {
            (db.run as jest.Mock) = jest.fn((sql, params, callback) => callback(new Error('Database error')));

            const model = 'TestModel';
            const category = 'Smartphone' as Category;
            const quantity = 10;
            const details = 'Some details';
            const sellingPrice = 100;
            const arrivalDate = '2023-01-01';

            await expect(productDAO.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate)).rejects.toThrow('Database error');
        });
    });

    describe('changeProductQuantity', () => {
        test('should increase the quantity of a product successfully', async () => {
            const model = 'TestModel';
            const changeDate = '2023-01-02';
            const oldQuantity = 10;
            const addQuantity = 5;
            const newQuantity = oldQuantity + addQuantity;

            const mockRun = jest.fn((sql, params, callback) => callback(null));
            (db.run as jest.Mock) = mockRun;
            const mockAll = jest.fn((sql, params, callback) => callback(null, [{ quantity: newQuantity }]));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.changeProductQuantity(model, addQuantity, changeDate);

            expect(mockRun).toHaveBeenCalledWith(
                "UPDATE products SET quantity = quantity + ? WHERE model = ?",
                [addQuantity, model],
                expect.any(Function)
            );
            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE model = ?",
                [model],
                expect.any(Function)
            );
            expect(result).toBe(newQuantity);
        });

        test('should reject with an error if the database operation fails', async () => {
            (db.run as jest.Mock) = jest.fn((sql, params, callback) => callback(new Error('Database error')));

            const model = 'TestModel';
            const changeDate = '2023-01-02';
            const addQuantity = 5;

            await expect(productDAO.changeProductQuantity(model, addQuantity, changeDate)).rejects.toThrow('Database error');
        });
    });

    describe('sellProduct', () => {
        test('should decrease the quantity of a product successfully', async () => {
            const model = 'TestModel';
            const sellingDate = '2023-01-02';
            const oldQuantity = 10;
            const soldQuantity = 5;
            const newQuantity = oldQuantity - soldQuantity;

            const mockRun = jest.fn((sql, params, callback) => callback(null));
            (db.run as jest.Mock) = mockRun;
            const mockAll = jest.fn((sql, params, callback) => callback(null, [{ quantity: newQuantity }]));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.sellProduct(model, soldQuantity, sellingDate);

            expect(mockRun).toHaveBeenCalledWith(
                "UPDATE products SET quantity = quantity - ? WHERE model = ?",
                [soldQuantity, model],
                expect.any(Function)
            );
            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE model = ?",
                [model],
                expect.any(Function)
            );
            expect(result).toBe(newQuantity);
        });

        test('should reject with an error if the database operation fails', async () => {
            (db.run as jest.Mock) = jest.fn((sql, params, callback) => callback(new Error('Database error')));

            const model = 'TestModel';
            const sellingDate = '2023-01-02';
            const soldQuantity = 5;

            await expect(productDAO.sellProduct(model, soldQuantity, sellingDate)).rejects.toThrow('Database error');
        });
    });

    describe('getProducts', () => {
        test('should return all products successfully', async () => {
            const mockAll = jest.fn((sql, params, callback) => callback(null, products));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.getProducts(null, null, null);

            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products",
                [],
                expect.any(Function)
            );
            expect(result).toEqual(products);
        });

        test('should return all products filtered by category successfully', async () => {
            const category = 'Smartphone';
            const filteredProducts = products.filter(product => product.category === Category.SMARTPHONE);

            const mockAll = jest.fn((sql, params, callback) => callback(null, filteredProducts));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.getProducts('category', category, null);

            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE category = ?",
                [category],
                expect.any(Function)
            );
            expect(result).toEqual(filteredProducts);
        });

        test('should return all products filtered by model successfully', async () => {
            const model = 'Samsung Galaxy S21';
            const filteredProducts = products.filter(product => product.model === model);

            const mockAll = jest.fn((sql, params, callback) => callback(null, filteredProducts));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.getProducts('model', null, model);

            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE model = ?",
                [model],
                expect.any(Function)
            );
            expect(result).toEqual(filteredProducts);
        });
    });

    describe('getAvailableProducts', () => {
        test('should return all available products successfully', async () => {
            const mockAll = jest.fn((sql, params, callback) => callback(null, products));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.getAvailableProducts('', '', '');

            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE quantity > 0",
                [],
                expect.any(Function)
            );
            expect(result).toEqual(products);
        })

        test('should return all available products filtered by category successfully', async () => {
            const category = 'Smartphone';
            const filteredProducts = products.filter(product => product.category === Category.SMARTPHONE);

            const mockAll = jest.fn((sql, params, callback) => callback(null, filteredProducts));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.getAvailableProducts('category', category, '');

            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE quantity > 0 AND category = ?",
                [category],
                expect.any(Function)
            );
            expect(result).toEqual(filteredProducts);
        });

        test('should return all available products filtered by model successfully', async () => {
            const model = 'Samsung Galaxy S21';
            const filteredProducts = products.filter(product => product.model === model);

            const mockAll = jest.fn((sql, params, callback) => callback(null, filteredProducts));
            (db.all as jest.Mock) = mockAll;

            const result = await productDAO.getAvailableProducts('model', '', model);

            expect(mockAll).toHaveBeenCalledWith(
                "SELECT * FROM products WHERE quantity > 0 AND model = ?",
                [model],
                expect.any(Function)
            );
            expect(result).toEqual(filteredProducts);
        });

        test('should reject with an error if the database operation fails', async () => {
            (db.all as jest.Mock) = jest.fn((sql, params, callback) => callback(new Error('Database error')));

            await expect(productDAO.getAvailableProducts('', '', '')).rejects.toThrow('Database error');
        });
    })

    describe('deleteProduct', () => {
        test('should delete a product successfully', async () => {
            const model = 'TestModel';

            const mockRun = jest.fn((sql, params, callback) => callback(null));
            (db.run as jest.Mock) = mockRun;

            await productDAO.deleteProduct(model);

            expect(mockRun).toHaveBeenCalledWith(
                "DELETE FROM products WHERE model = ?",
                [model],
                expect.any(Function)
            );
        });

        test('should reject with an error if the database operation fails', async () => {
            (db.run as jest.Mock) = jest.fn((sql, params, callback) => callback(new Error('Database error')));

            const model = 'TestModel';

            await expect(productDAO.deleteProduct(model)).rejects.toThrow('Database error');
        });
    });

    describe('deleteAllProducts', () => {
        test('should delete all products successfully', async () => {
            const mockRun = jest.fn((sql, params, callback) => callback(null));
            (db.run as jest.Mock) = mockRun;

            await productDAO.deleteAllProducts();

            expect(mockRun).toHaveBeenCalledWith(
                "DELETE FROM products",
                [],
                expect.any(Function)
            );
        });

        test('should reject with an error if the database operation fails', async () => {
            (db.run as jest.Mock) = jest.fn((sql, params, callback) => callback(new Error('Database error')));

            await expect(productDAO.deleteAllProducts()).rejects.toThrow('Database error');
        });
    });
});