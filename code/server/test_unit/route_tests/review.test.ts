import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import request from 'supertest';
import { app } from "../../index"

import ReviewController from '../../src/controllers/reviewController';
import Authenticator from '../../src/routers/auth';
import { Category, Product } from '../../src/components/product';
import { ProductReview } from "../../src/components/review";

// Mock dependencies
jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

const ReviewControllerMock = ReviewController as jest.MockedClass<typeof ReviewController>;
const AuthenticatorMock = Authenticator as jest.MockedClass<typeof Authenticator>;

describe('Review Routes Unit Tests', () => {
    describe('POST /:model', () => {
        test('should create a new review', async () => {
            const review = { score: 5, comment: "Excellent product!" };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce();

            const res = await request(app)
                .post('/ezelectronics/reviews/Huawei-Matebook')
                .send(review)
                .expect(200);

            expect(res.status).toBe(200);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled();
        });

        test('should return 422 for invalid score', async () => {
            const review = { score: 6, comment: "Excellent product!" };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce({customMessage: "Invalid score", customCode: 422});

            const res = await request(app)
                .post('/ezelectronics/reviews/Huawei-Matebook')
                .send(review)
                .expect(422);

            expect(res.status).toBe(422);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled();
        });

        test('should return 404 for non-existent product', async () => {
            const review = { score: 5, comment: "Excellent product!" };

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce({customMessage: "Product does not exist", customCode: 404});

            const res = await request(app)
                .post('/ezelectronics/reviews/NonExistentProduct')
                .send(review)
                .expect(404);

            expect(res.status).toBe(404);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled();
        });
    });

    describe('GET /:model', () => {
        test('should retrieve all reviews for a product', async () => {
            const reviews = [
                new ProductReview("Huawei-Matebook", "test", 5, "2022-01-01", "Great!" ),
                new ProductReview("Ipad", "test", 1, "2022-01-01", "not great!" )
            ];

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(reviews);

            const res = await request(app)
                .get('/ezelectronics/reviews/Huawei-Matebook')
                .expect(200);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(reviews);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled();
        });

        test('should return 404 for non-existent product reviews', async () => {
          
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce({customMessage: "No reviews for product", customCode: 404});
            const res = await request(app)
                .get('/ezelectronics/reviews/NonExistentProduct')
                .expect(404);

            expect(res.status).toBe(404);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled();
        });
    });

    describe('DELETE /:model', () => {
        test('should delete a review for a product', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(); 
            const res = await request(app)
                .delete('/ezelectronics/reviews/Huawei-Matebook')
                .expect(200);

            expect(res.status).toBe(200);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalled();
        });

        test('should return 404 for non-existent product review', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce({customMessage: "No review for product", customCode: 404});
            const res = await request(app)
                .delete('/ezelectronics/reviews/NonExistentProduct')
                .expect(404);

            expect(res.status).toBe(404);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalled();
        });
    });

    describe('DELETE /all/:model', () => {
        test('should delete all reviews for a product', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue();
            const res = await request(app).delete('/ezelectronics/reviews/Huawei-Matebook/all')

            expect(res.status).toBe(200);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith('Huawei-Matebook');
        });

        test('should return 404 for non-existent product', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValue({customMessage: "Product does not exist", customCode: 404});
            const res = await request(app).delete('/ezelectronics/reviews/NonExistentProduct/all')

            expect(res.status).toBe(404);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled();
        });
    });

    describe('DELETE /', () => {
        test('should delete all reviews', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue();
            
            const res = await request(app).delete('/ezelectronics/reviews')

            expect(res.status).toBe(200);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled();
        });
    });
});
