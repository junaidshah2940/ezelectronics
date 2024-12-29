import request from 'supertest';
import { app } from "../index"; // Adjust the import based on your project structure
import { cleanup } from "../src/db/cleanup";
import { beforeAll, afterAll, describe, test, expect } from "@jest/globals";
import { User } from '../src/components/user';

const routePath = "/ezelectronics"; // Base route path for the API

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
let adminCookie: string;
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };
let managerCookie: string;
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
let customerCookie: string;

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

beforeAll(async () => {
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 15000))
    await postUser(admin);
    adminCookie = await login(admin);
    await postUser(manager);
    managerCookie = await login(manager);
    await postUser(customer);
    customerCookie = await login(customer);
});

afterAll(() => {
    cleanup();
});

describe('User Integration Tests', () => {
    test('should retrieve users by role', async () => {
        const role = 'Customer';
        const res = await request(app)
            .get(`${routePath}/users/roles/${role}`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        res.body.forEach((user: User) => {
            expect(user.role).toBe(role);
        });
    });

    test('should retrieve user by username for admin', async () => {
        const username = 'customer';
        const res = await request(app)
            .get(`${routePath}/users/${username}`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('username', username);
    });

    test('should retrieve own user data', async () => {
        const res = await request(app)
            .get(`${routePath}/sessions/current`)
            .set('Cookie', customerCookie);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('username', 'customer');
    });

    test('should update user info', async () => {
        const updateData = {
            name: 'customer',
            surname: 'UpdatedSurname',
            address: 'UpdatedAddress',
            birthdate: '2000-01-01'
        };
        const username = 'customer';
        const res = await request(app)
            .patch(`${routePath}/users/${username}`)
            .send(updateData)
            .set('Cookie', customerCookie);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(updateData);
    });

    test('should delete a user', async () => {
        const username = 'manager';
        const res = await request(app)
            .delete(`${routePath}/users/${username}`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(200);
    });

    test('should delete all users as admin', async () => {
        const res = await request(app)
            .delete(`${routePath}/users`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(200);

        const getUsersRes = await request(app)
            .get(`${routePath}/users`)
            .set('Cookie', adminCookie);

        const getAdminUsers = await request(app)
            .get(`${routePath}/users/roles/Admin`)
            .set('Cookie', adminCookie);

        expect(getUsersRes.body.length).toBe(getAdminUsers.body.length);
    });

    test('should return 401 if not logged in', async () => {

        const res = await request(app)
            .get(`${routePath}/sessions/current`);

        expect(res.status).toBe(401);
    });

    test('should fail to delete all users as non-admin', async () => {
        const res = await request(app)
            .delete(`${routePath}/users`)
            .set('Cookie', customerCookie);

        expect(res.status).toBe(401);
    });

    test('should return 404 if user does not exist', async () => {
        const username = 'nonExistentUser';
        const res = await request(app)
            .get(`${routePath}/users/${username}`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(404);
    });
});
