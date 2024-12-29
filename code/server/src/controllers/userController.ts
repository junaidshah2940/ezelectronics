import { User } from "../components/user"
import UserDAO from "../dao/userDAO"
import { UnauthorizedUserError } from "../errors/userError";


/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */

class HttpError extends Error {
    customMessage: string
    customCode: number

    constructor(message: string, statusCode: number) {
        super()
        this.customMessage = message
        this.customCode = statusCode
    }
}
class UserController {
    private dao: UserDAO
    private validRoles = ["Manager", "Customer", "Admin"]

    constructor() {
        this.dao = new UserDAO
    }

    /**
     * Creates a new user.
     * @param username - The username of the new user. It must not be null and it must not be already taken.
     * @param name - The name of the new user. It must not be null.
     * @param surname - The surname of the new user. It must not be null.
     * @param password - The password of the new user. It must not be null.
     * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, password: string, role: string): Promise<Boolean> {
        if (!username.trim() || !name.trim() || !surname.trim() || !password.trim() || !role.trim()) {
            return Promise.reject({ status: 422, message: 'parameter missing' });
        } else if (role !== 'Admin' && role !== 'Manager' && role !== 'Customer') {
            return Promise.reject(new HttpError('Role is not valid', 422));
        } else {
            return this.dao.createUser(username, name, surname, password, role)
        }
    }

    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    async getUsers(): Promise<User[]> {
        return this.dao.getUsers()
    }

    /**
     * Returns all users with a specific role.
     * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to an array of users with the specified role.
     */

    async getUsersByRole(role: string): Promise<User[]> {
        role = role.trim();
        if (!role) {
            return Promise.reject(new HttpError('Role is required', 422));
        } else if (role !== 'Admin' && role !== 'Manager' && role !== 'Customer') {
            return Promise.reject(new HttpError('Role is not valid', 422));
        } else {
            return this.dao.getUsersByRole(role);
        }
    }

    /**
     * Returns a specific user.
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can retrieve any user
     * - Other roles can only retrieve their own information
     * @param username - The username of the user to retrieve. The user must exist.
     * @returns A Promise that resolves to the user with the specified username.
     */
    async getUserByUsername(user: User, username: string): Promise<User> {
        if (user.username !== username && user.role !== "Admin") {
            return Promise.reject(new HttpError('Unauthorized', 401));
        }
        return this.dao.getUserByUsername(username);
    }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * @param username - The username of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(user: User, username: string): Promise<Boolean> {
        if (user.role !== "Admin" && user.username !== username) {
            return Promise.reject(new HttpError('Unauthorized', 401));
        }
        try{
            const userdata = await this.dao.getUserByUsername(username)
            if (userdata.role === "Admin" && userdata.username !== user.username) {
                return Promise.reject(new HttpError('Unauthorized', 401));
            }else{
                return this.dao.deleteUser(username)
            }
        }catch{
            return Promise.reject(new HttpError('User not found', 404));
        }
    }

    /**
     * Deletes all non-Admin users
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    async deleteAll(): Promise<Boolean> {
        return this.dao.deleteAll();
    }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * @param user The user who wants to update their information
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update. It must be equal to the username of the user parameter.
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string): Promise<User> {
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (new Date(birthdate) > new Date()) {
            return Promise.reject(new HttpError('Birthdate is not valid', 400));
        }else if (!dateFormatRegex.test(birthdate)){
            return Promise.reject(new HttpError('Birthdate format is not valid', 422));
        }
        if(!name.trim() || !surname.trim() || !address.trim() || !birthdate.trim()){
            return Promise.reject(new HttpError('parameter missing', 422));
        }
        if (user.role !== "Admin" && user.username !== username) {
            return Promise.reject(new HttpError('Unauthorized', 401));
        }
        return this.dao.updateUserInfo(user, name, surname, address, birthdate, username)
    }
}

export default UserController