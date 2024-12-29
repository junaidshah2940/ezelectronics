import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from "@jest/globals"
// @ts-ignore
import request from 'supertest'
import { app } from "../../index"
import { Request, Response, NextFunction } from 'express';
import { User, Role } from '../../src/components/user';
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { HttpError } from "../../src/controllers/productController";

const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

describe('User Routes Unit Tests', () => {
    test('should create a new user', async () => {
        jest.spyOn(UserController.prototype, 'createUser').mockResolvedValueOnce(true)

        const response = await request(app).post(`${baseURL}/users`).send([           
            new User("test", "test", "test", Role.CUSTOMER, "", "")
        ])
        expect(response.status).toBe(200)
        expect(UserController.prototype.createUser).toHaveBeenCalled()
    });
    
    test('should retrieve users by role', async () => {
        const testAdmin: User = { 
            username: 'admin', 
            name: 'Admin', 
            surname: 'User', 
            role: Role.ADMIN,
            address: '', // Add the missing 'address' property
            birthdate: '' // Add the missing 'birthdate' property
        };
        jest.spyOn(UserController.prototype, 'getUsersByRole').mockResolvedValueOnce([testAdmin]);
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());

        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }));

        const response = await request(app).get(`${baseURL}/users/roles/Admin`);
        expect(response.status).toBe(200);
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith('Admin');
        expect(response.body).toEqual([testAdmin]);
    });

    test('should retrieve user by username', async () => {
        jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValueOnce(
            new User("test", "test", "test", Role.CUSTOMER, "", "")
        )
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).get(`${baseURL}/users/test`)
        expect(response.status).toBe(200)
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
    });

    test('should update user info', async () => {
        jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValueOnce(new User("test", "test", "test", Role.CUSTOMER, "", ""))
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).patch(`${baseURL}/users/test`).send(
            new User("test", "test", "test", Role.CUSTOMER, "", "")
        )
        expect(response.status).toBe(200)
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalled()
    });

    test('should delete a user', async () => {
        jest.spyOn(UserController.prototype, 'deleteUser').mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).delete(`${baseURL}/users/test`)
        expect(response.status).toBe(200)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    });

    test('should handle non-existent user', async () => {
        jest.spyOn(UserController.prototype, 'deleteUser').mockRejectedValueOnce({customMessage: "User not found", customCode: 404})
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).delete(`${baseURL}/users/test`)
        expect(response.status).toBe(404)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    });
});

