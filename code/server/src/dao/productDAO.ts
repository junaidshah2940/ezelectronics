import {Category, Product} from "../components/product";
import db from "../db/db";
import { ProductNotFoundError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional string that represents a date. If present, it must be in the format YYYY-MM-DD. If absent, then the current date is used as the arrival date for the product, in the same format.
     * @returns A Promise that resolves to nothing.
     */
    registerProducts(model: string, category: Category, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const date = arrivalDate ? arrivalDate : new Date().toISOString().split("T")[0];
            const sql = "INSERT INTO products(model, category, quantity, details, sellingPrice, arrivalDate) VALUES(?, ?, ?, ?, ?, ?)";
            db.run(sql, [model, category, quantity, details, sellingPrice, date], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const sql = "UPDATE products SET quantity = quantity + ? WHERE model = ?";
            db.run(sql, [newQuantity, model], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    this.getProducts("model", null, model).then((product) => {
                        resolve(product[0].quantity);
                    }).catch((err) => {
                        reject(err);
                    });
                }
            });
        });
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?";
            db.run(sql, [quantity, model], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    this.getProducts("model", null, model).then((product) => {
                        resolve(product[0].quantity);
                    }).catch((err) => {
                        reject(err);
                    });
                }
            });
        });
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            let sql = "SELECT * FROM products";
            if (grouping && grouping === "category") {
                sql += " WHERE category = ?";
                db.all(sql, [category], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                })
            } else if (grouping && grouping === "model") {
                sql += " WHERE model = ?";
                db.all(sql, [model], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                })
            } else {
                db.all(sql, [], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                })
            }
        });
    }

    /**
     * Returns all available products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     */
    getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            let sql = "SELECT * FROM products WHERE quantity > 0";
            if (grouping && grouping === "category") {
                sql += " AND category = ?";
                db.all(sql, [category], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            } else if (grouping && grouping === "model") {
                sql += " AND model = ?";
                db.all(sql, [model], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            } else {
                db.all(sql, [], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            }
        });
    }



    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     */
    deleteProduct(model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = "DELETE FROM products WHERE model = ?";
            db.run(sql, [model], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Deletes all products.
     */
    deleteAllProducts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            const sql = "DELETE FROM products";
            db.run(sql, [], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            })
        });
    }
}

export default ProductDAO