import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import { ProductReview } from "../../src/components/review"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import productDAO from "../../src/dao/productDAO"
import { User, Role } from "../../src/components/user"


import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Category } from "../../src/components/product"

jest.mock("../../src/dao/productDAO")
jest.mock("../../src/dao/reviewDAO")

//unit test for addReview method
test("It should resolve 'review added succesfully'", async () => {
    const testUser = new User("test", "test", "test", Role.CUSTOMER, "", "")
    const reviewController = new ReviewController()
    const mockGetProducts = jest.spyOn(productDAO.prototype, "getProducts").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve([{
                model: "model",
                sellingPrice: 0,
                category: Category.SMARTPHONE,
                arrivalDate: null,
                details: null,
                quantity: 0
            }])
        })
    })
    const mockGetUserReview = jest.spyOn(ReviewDAO.prototype, "getUserReview").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve(null)
        })
    })
    const mockAddReview = jest.spyOn(ReviewDAO.prototype, "addReview").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve()
        })
    })
    await expect(reviewController.addReview("model", testUser, 5, "comment")).resolves.toBeUndefined();
    mockGetProducts.mockRestore()
    mockGetUserReview.mockRestore()
    mockAddReview.mockRestore()
})

//unit test for getProductReviews method
test("It should resolve an array of reviews", async () => {
    const reviewController = new ReviewController()
    const mockGetProducts = jest.spyOn(productDAO.prototype, "getProducts").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve([{
                model: "model",
                sellingPrice: 0,
                category: Category.SMARTPHONE,
                arrivalDate: null,
                details: null,
                quantity: 0
            }])
        })
    })
    const mockGetProductReviews = jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve([new ProductReview("model", "username", 5, "2024-06-11", "comment" )])
        })
    })
    const result = await reviewController.getProductReviews({ params: { model: "model" } })
    expect(result).toEqual([new ProductReview("model", "username", 5, "2024-06-11", "comment" )])
    mockGetProducts.mockRestore()
    mockGetProductReviews.mockRestore()
})

//unit test for deleteReview method
test("It should resolve 'review deleted succesfully'", async () => {
    const testUser = new User("test", "test", "test", Role.CUSTOMER, "", "")
    const reviewController = new ReviewController()
    const mockDeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve()
        })
    })

    // Mock getProducts method
    const mockGetProducts = jest.spyOn(productDAO.prototype, "getProducts").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve([{
                model: "model",
                sellingPrice: 0,
                category: Category.SMARTPHONE,
                arrivalDate: null,
                details: null,
                quantity: 0
            }])        
        })
    })

    // Mock getUserReview method
    const mockGetUserReview = jest.spyOn(ReviewDAO.prototype, "getUserReview").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve({model: "model", username: "test", review: "test review"}) // return a mock review
        })
    })
    await expect(reviewController.deleteReview("model", testUser)).resolves.toBeUndefined();
    mockDeleteReview.mockRestore()
    mockGetProducts.mockRestore() // restore the mock after the test
    mockGetUserReview.mockRestore() // restore the mock after the test
})

//unit test for deleteReviewsOfProduct method
test("It should resolve for product 'reviews deleted succesfully'", async () => {
    const reviewController = new ReviewController()
    const mockDeleteReviewsOfProduct = jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve()
        })
    })

    // Mock getProducts method
    const mockGetProducts = jest.spyOn(productDAO.prototype, "getProducts").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve([{
                model: "model",
                sellingPrice: 0,
                category: Category.SMARTPHONE,
                arrivalDate: null,
                details: null,
                quantity: 0
            }])        
        })
    })

    await expect(reviewController.deleteReviewsOfProduct("model")).resolves.toBeUndefined();
    mockDeleteReviewsOfProduct.mockRestore()
    mockGetProducts.mockRestore() // restore the mock after the test
})

//unit test for deleteAllReviews method
test("It should resolve 'all reviews deleted succesfully'", async () => {
    const reviewController = new ReviewController()
    const mockDeleteAllReviews = jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockImplementation(() => {
        return new Promise((resolve, reject) => {
            resolve()
        })
    })
    await expect(reviewController.deleteAllReviews()).resolves.toBeUndefined();
    mockDeleteAllReviews.mockRestore()
})