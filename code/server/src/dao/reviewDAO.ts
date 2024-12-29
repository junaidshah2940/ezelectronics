import db from "../db/db"
import { ProductReview } from "../components/review"
import { ExistingReviewError, NoReviewProductError, ProductDoesntExist } from "../errors/reviewError";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    getUserReview(model: string, username: string): Promise<any>{
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM reviews WHERE model = ? AND user = ?", [model, username], (err: any, row: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(row)
                }
            })
        })
    }

    addReview(model: string, username: string, score: number, comment: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)", [model, username, score, new Date().toISOString().split("T")[0], comment], (err: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            db.all("SELECT * FROM reviews WHERE model = ?", [model], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err)
                }
                const reviews: ProductReview[] = rows.map(row => new ProductReview(row.model, row.user, row.score, row.date, row.comment));
                resolve(reviews)
            })
        })
    }

    deleteReview(model: string, username: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM reviews WHERE model = ? AND user = ?", [model, username], (err: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM reviews WHERE model = ?", [model], (err: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    deleteAllReviews(): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM reviews", (err: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
}

export default ReviewDAO;