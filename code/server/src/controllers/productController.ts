import ProductDAO from "../dao/productDAO";
import {Category, Product} from "../components/product";
import {
    EmptyProductStockError,
    LowProductStockError,
    ProductAlreadyExistsError,
    ProductNotFoundError
} from "../errors/productError";
import {DateError} from "../utilities";

class HttpError extends Error {
    customMessage: string
    customCode: number

    constructor(message: string, statusCode: number) {
        super()
        this.customMessage = message
        this.customCode = statusCode
    }
}

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     * @throws ProductAlreadyExistsError if the product already exists.
     * @throws HttpError if the arrival date is in the future.
     */
    async registerProducts(model: string, category: Category, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (arrivalDate && new Date(arrivalDate) > new Date()) {
                reject(new DateError());
            } else {
                this.dao.getProducts("model", null, model).then((product) => {
                    if (product.length > 0) {
                        reject(new ProductAlreadyExistsError());
                    } else {
                        this.dao.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate).then(() => {
                            resolve();
                        }).catch((err) => {
                            reject(err);
                        });
                    }
                })
            }
        })
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     * @throws ProductNotFoundError if the product is not found.
     * @throws HttpError if the change date is in the future or before the arrival date.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (changeDate && new Date(changeDate) > new Date()) {
                reject(new DateError());
            } else {
                this.dao.getProducts("model", null, model).then((product) => {
                    if (product.length === 0) {
                        reject(new ProductNotFoundError());
                    } else {
                        if (changeDate && product[0].arrivalDate && new Date(changeDate) < new Date(product[0].arrivalDate)) {
                            reject(new DateError());
                        } else {
                            this.dao.changeProductQuantity(model, newQuantity, changeDate).then((quantity) => {
                                resolve(quantity);
                            }).catch((err) => {
                                reject(err);
                            });
                        }
                    }
                })
            }
        })
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     * @throws ProductNotFoundError if the product is not found.
     * @throws HttpError if the selling date is in the future or before the arrival date.
     * @throws HttpError if the quantity is less than or equal to 0.
     * @throws HttpError if the model is empty.
     * @throws HttpError if the quantity to sell is greater than the available quantity.
     * @throws ProductSoldError if the product is already sold.
     * @throws EmptyProductStockError if the product stock is empty.
     * @throws LowProductStockError if the product stock cannot satisfy the requested quantity.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (sellingDate && new Date(sellingDate) > new Date()) {
                reject(new DateError());
            } else {
                this.dao.getProducts("model", null, model).then((product) => {
                    if (product.length === 0) {
                        reject(new ProductNotFoundError());
                    } else {
                        if (product[0].quantity === 0) {
                            reject(new EmptyProductStockError());
                        } else if (product[0].quantity < quantity && product[0].quantity !== 0) {
                            reject(new LowProductStockError());
                        } else if (product[0].arrivalDate && sellingDate && new Date(sellingDate) < new Date(product[0].arrivalDate)) {
                            reject(new DateError());
                        } else {
                            this.dao.sellProduct(model, quantity, sellingDate).then((quantity) => {
                                resolve(quantity);
                            }).catch((err) => {
                                reject(err);
                            });
                        }
                    }
                })
            }
        })
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                this.validateGroupingParameters(grouping, category, model);
                this.dao.getProducts(grouping, category, model).then((products) => {
                    if (products.length === 0 && grouping === "model" && model) {
                        reject(new ProductNotFoundError());
                    } else {
                        resolve(products);
                    }
                }).catch((err) => {
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                this.validateGroupingParameters(grouping, category, model);
                this.dao.getAvailableProducts(grouping, category, model).then((products) => {
                    if (products.length === 0 && grouping === "model" && model) {
                        this.dao.getProducts("model", null, model).then((product) => {
                            if (product.length === 0) {
                                reject(new ProductNotFoundError());
                            } else {
                                resolve([]);
                            }
                        })
                    } else {
                        resolve(products);
                    }
                }).catch((err) => {
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        })
    }



    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            this.dao.deleteAllProducts().then(() => {
                resolve(true);
            }).catch((err) => {
                reject(err);
            });
        })
    }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            this.dao.getProducts("model", null, model).then((product) => {
                if (product.length === 0) {
                    reject(new ProductNotFoundError());
                } else {
                    this.dao.deleteProduct(model).then(() => {
                        resolve(true);
                    }).catch((err) => {
                        reject(err);
                    });
                }
            })
        })
    }

    /**
     * Validates the grouping parameters.
     * @param grouping The grouping parameter.
     * @param category The category parameter.
     * @param model The model parameter.
     * @throws HttpError if the parameters are invalid.
     */
    validateGroupingParameters(grouping: string | null, category: string | null, model: string | null): void {
        if(grouping === "" || category === "" || model === "") {
            throw new HttpError("Invalid grouping", 422);
        } else if (grouping && (grouping !== "category" && grouping !== "model")) {
            throw new HttpError("Invalid grouping", 422);
        } else if ((grouping && grouping === "category") && ((!category || (category !== "Smartphone" && category !== "Laptop" && category !== "Appliance")) || model)) {
            throw new HttpError("Invalid category", 422);
        } else if ((grouping && grouping === "model") && (!model || model === "" || category)) {
            throw new HttpError("Invalid model", 422)
        } else if (!grouping && (category || model)) {
            throw new HttpError("Invalid grouping", 422);
        }
    }

}

export default ProductController;
export {HttpError};