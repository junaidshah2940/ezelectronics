import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import { User, Role } from "../../src/components/user"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
// @ts-ignore
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"

jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
        return (Buffer.from("salt"))
    })
    const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const result = await userDAO.createUser("username", "name", "surname", "password", "role")
    expect(result).toBe(true)
    mockRandomBytes.mockRestore()
    mockDBRun.mockRestore()
    mockScrypt.mockRestore()
})

//test for getIsUserAuthenticated method
//It mocks the database get method to simulate a successful authentication of an user

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { username: "admin", password: Buffer.from("hashedPassword").toString("hex"), salt: Buffer.from("salt") })
        return {} as Database
    });
    const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
        return Buffer.from("hashedPassword")
    })
    const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((a, b) => {
        return a.toString() === b.toString()
    })
    const result = await userDAO.getIsUserAuthenticated("admin", "password")
    expect(result).toBe(true)
    mockDBGet.mockRestore()
    mockScryptSync.mockRestore()
    mockTimingSafeEqual.mockRestore()
})

//test for getUserByUsername method
//It mocks the database get method to simulate a successful retrieval of an user

test("It should resolve a user", async () => { 
    const userDAO = new UserDAO()
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { username: "admin", name: "admin", surname: "admin", role: "Admin", address: "", birthdate: "" })
        return {} as Database
    });
    const result = await userDAO.getUserByUsername("admin")
    expect(result).toEqual({ username: "admin", name: "admin", surname: "admin", role: "Admin", address: "", birthdate: "" })
    mockDBGet.mockRestore()
})

//test for getUsers method
//It mocks the database all method to simulate a successful retrieval of all users

test("It should resolve an array of users", async () => {
    const userDAO = new UserDAO()
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{ username: "admin", name: "admin", surname: "admin", role: "Admin", address: "", birthdate: "" }, { username: "customer", name: "customer", surname: "customer", role: "customer", address: "", birthdate: "" }])
        return {} as Database
    });
    const result = await userDAO.getUsers()
    expect(result).toEqual([{ username: "admin", name: "admin", surname: "admin", role: "Admin", address: "", birthdate: "" }, { username: "customer", name: "customer", surname: "customer", role: "customer", address: "", birthdate: "" }])
    mockDBAll.mockRestore()
})

//test for getUsersByRole method
//It mocks the database all method to simulate a successful retrieval of all users with a specific role

test("It should resolve an array of users", async () => {
    const userDAO = new UserDAO()
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{ username: "admin", name: "admin", surname: "admin", role: "Admin", address: "", birthdate: "" }])
        return {} as Database
    });
    const result = await userDAO.getUsersByRole("Admin")
    expect(result).toEqual([{ username: "admin", name: "admin", surname: "admin", role: "Admin", address: "", birthdate: "" }])
    mockDBAll.mockRestore()
})

//test for deleteUser method
//It mocks the database run method to simulate a successful deletion of an user

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await userDAO.deleteUser("admin")
    expect(result).toBe(true)
    mockDBRun.mockRestore()
})

//test for deleteAll method
//It mocks the database run method to simulate a successful deletion of all users

test("It should resolve true", async () => {
    const userDAO = new UserDAO()
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });
    const result = await userDAO.deleteAll()
    expect(result).toBe(true)
    mockDBRun.mockRestore()
})

//test for updateUser method
//It mocks the database run method to simulate a successful update of an user

test("It should resolve with updated user", async () => {
    const adminUser = new User("admin", "admin", "admin", Role.ADMIN, "", "")
    const userDAO = new UserDAO()
    
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null)
        return {} as Database
    });

    const mockGetUserByUsername = jest.spyOn(userDAO, 'getUserByUsername').mockResolvedValue(adminUser);

    const result = await userDAO.updateUserInfo(adminUser, "admin", "admin", "", "", "admin")
    expect(result).toEqual(new User("admin", "admin", "admin", Role.ADMIN, "", ""))
    
    mockDBRun.mockRestore()
    mockGetUserByUsername.mockRestore()
})