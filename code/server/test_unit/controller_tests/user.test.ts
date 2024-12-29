import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});

//unit test for getUsers method
test("It should return an array of users", async () => {
    const users = [new User("test1", "test1", "test1", Role.MANAGER, "", "" ), new User("test2", "test2", "test2", Role.CUSTOMER, "", "")];
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(users); //Mock the getUsers method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    const response = await controller.getUsers(); //Call the getUsers method of the controller

    //Check if the getUsers method of the DAO has been called once
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
    expect(response).toEqual(users); //Check if the response is an array of users
})

//unit test for getUserByRole method
test("It should return an array of users with the specified role", async () => {
    const users = [new User("test1", "test1", "test1", Role.MANAGER, "", "" ), new User("test2", "test2", "test2", Role.MANAGER, "", "")];
    jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(users); //Mock the getUsersByRole method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    const response = await controller.getUsersByRole("Manager"); //Call the getUsersByRole method of the controller

    //Check if the getUsersByRole method of the DAO has been called once with the correct parameter
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Manager");
    expect(response).toEqual(users); //Check if the response is an array of users
})

//unit test for getUserByUsername method
test("It should return a user with the specified username", async () => {
    const user = new User("test", "test", "test", Role.MANAGER, "", "");
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user); //Mock the getUserByUsername method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    const response = await controller.getUserByUsername(user, "test"); //Call the getUserByUsername method of the controller
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1); //Check if the getUserByUsername method of the DAO has been called once
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("test"); //Check if the getUserByUsername method of the DAO has been called with the correct parameter
    expect(response).toEqual(user); //Check if the response is the user object
})

//unit test for deleteUser method
test("It should return true", async () => {
    const admin = new User("test", "test", "test", Role.ADMIN, "", "");
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(admin); //Mock the getUserByUsername method of the DAO
    jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true); //Mock the deleteUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    const response = await controller.deleteUser(admin, "test"); //Call the deleteUser method of the controller

    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1); //Check if the deleteUser method of the DAO has been called once
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("test"); //Check if the deleteUser method of the DAO has been called with the correct parameter
    expect(response).toBe(true); //Check if the response is true
})

//unit test for deleteAll method
test("It should return true", async () => {
    jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true); //Mock the deleteAll method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    const response = await controller.deleteAll(); //Call the deleteAll method of the controller

    expect(UserDAO.prototype.deleteAll).toHaveBeenCalledTimes(1); //Check if the deleteAll method of the DAO has been called once
    expect(response).toBe(true); //Check if the response is true
})

//unit test for updateUserInfo method
test("It should return the updated user", async () => {
    const admin = new User("test", "test", "test", Role.ADMIN, "", "");
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(admin); //Mock the updateUserInfo method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    const response = await controller.updateUserInfo(admin, "test", "test", "a", "2002-03-03", "test"); //Call the updateUserInfo method of the controller

    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1); //Check if the updateUserInfo method of the DAO has been called once
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(admin, "test", "test", "a", "2002-03-03", "test"); //Check if the updateUserInfo method of the DAO has been called with the correct parameters
    expect(response).toEqual(admin); //Check if the response is the updated user object
})