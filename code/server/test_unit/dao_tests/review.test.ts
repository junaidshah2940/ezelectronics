import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import { ProductReview } from "../../src/components/review"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { afterEach } from "@jest/globals";

jest.mock("../../src/db/db.ts")

afterEach(() => {
    jest.resetAllMocks();
});

//unit test for getUserReview method
test("It should resolve a review", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { model: "model", username: "username", score: 5, comment: "comment" })
        return {} as Database
    });
    const result = await reviewDAO.getUserReview("model", "username")
    expect(result).toEqual({ model: "model", username: "username", score: 5, comment: "comment" })
    mockDBGet.mockRestore()
})

//unit test for addReview method
test("It should resolve --addReview", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback = () => {}) => {
        callback(null)
        return {} as Database
    });
    const result = await reviewDAO.addReview("model", "username", 5, "comment")
    await expect(reviewDAO.addReview("model", "username", 5, "comment")).resolves.toBeUndefined();
    mockDBRun.mockRestore()
})
//unit test for getProductReviews method
test("It should resolve an array of reviews", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{ model: "model", user: "username", score: 5, date: "2024-06-11", comment: "comment" }])
        return {} as Database
    });
    const result = await reviewDAO.getProductReviews("model")
    expect(result).toEqual([ new ProductReview("model", "username", 5, "2024-06-11", "comment" )])
    mockDBAll.mockRestore()
})

//unit test for deleteReview method
test("It should resolve 'review deleted succesfully'", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    await expect(reviewDAO.deleteReview("model", "username")).resolves.toBeUndefined();
    mockDBRun.mockRestore()
})

//unit test for deleteReviewsOfProduct method
test("It should resolve for product 'reviews deleted succesfully'", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    await expect(reviewDAO.deleteReviewsOfProduct("model")).resolves.toBeUndefined();
    mockDBRun.mockRestore()
})

//unit test for deleteAllReviews method
test("It should resolve 'all reviews deleted succesfully'", async () => {
    const reviewDAO = new ReviewDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
        callback(null)
        return {} as Database
    });
    await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined();
    mockDBRun.mockRestore()
})