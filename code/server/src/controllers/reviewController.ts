import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import ProductDAO from "../dao/productDAO";
import { ProductReview } from "../components/review";
import { ExistingReviewError, NoReviewProductError, ProductDoesntExist } from "../errors/reviewError";

class HttpError extends Error {
    customMessage: string
    customCode: number

    constructor(message: string, statusCode: number) {
        super()
        this.customMessage = message
        this.customCode = statusCode
    }
}
class ReviewController {
    private dao: ReviewDAO
    private productDAO: ProductDAO

    constructor() {
        this.dao = new ReviewDAO
        this.productDAO = new ProductDAO
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        if (score < 1 || score > 5) {
            throw new HttpError("Invalid score", 422);
        }else if (!comment || !score) {
            throw new HttpError("Missing parameters", 422);
        }

        try {
            const product = await this.productDAO.getProducts("model", null, model);
            if (product.length === 0) {
                throw new HttpError("Product does not exist", 404);
            }

            const review = await this.dao.getUserReview(model, user.username);
            if (review) {
                throw new HttpError("User already reviewed this product", 409);
            }

            await this.dao.addReview(model, user.username, score, comment);
        } catch (err) {
            return Promise.reject(err)
        }
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(req: any): Promise<ProductReview[]> {
        let product = await this.productDAO.getProducts("model", null, req.params.model)
        if (product.length > 0) {
            return this.dao.getProductReviews(req.params.model)
        } else {
            throw new HttpError("No reviews for product", 404)
        }
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User): Promise<void> {
        const product = await this.productDAO.getProducts("model", null, model)
        if (product.length === 0) {
            throw new HttpError("Product does not exist", 404)
        }
        const review = await this.dao.getUserReview(model, user.username)
        if (review) {
            return this.dao.deleteReview(model, user.username);
        } else {
            throw new HttpError("No review for product", 404)
        }
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string): Promise<void> {
        console.log("Deleting reviews of product", model)
        const product = await this.productDAO.getProducts("model", null, model)
        console.log("Product", product)
        if (product.length === 0) {
            throw new HttpError("Product does not exist", 404)
        }
        return this.dao.deleteReviewsOfProduct(model)
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews(): Promise<void> {
        return this.dao.deleteAllReviews()
    }
}

export default ReviewController;