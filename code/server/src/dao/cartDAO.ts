import {User} from "../components/user";
import db from "../db/db";
import {Cart, ProductInCart} from "../components/cart"
import {Category, Product} from "../components/product";
import {EmptyProductStockError, ProductNotFoundError} from "../errors/productError";


/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    getCart(user:User){
        return new Promise<Cart>((resolve, reject) => {
                const sql = "SELECT P.model, P.category, P.sellingPrice as singleProductTotal, CP.quantity FROM carts C LEFT JOIN cart_product CP ON CP.cart_id = C.id LEFT JOIN products P ON P.id = CP.product_id WHERE C.paid = false AND C.customer = ?"
                db.all(sql, [user.username], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (rows.length === 0) {
                        const sql2 = "INSERT INTO carts (customer, paid, paymentDate) VALUES (?, false, NULL)"
                        db.run(sql2, [user.username], (err: Error | null) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            resolve(new Cart(user.username, false, null, 0, []))
                        })
                    }else {

                        if (rows[0].model === null) {
                            resolve(new Cart(user.username, false, null, 0, []))
                        }

                        const products: ProductInCart[] = rows.map(row => new ProductInCart(row.model, row.quantity, row.category, row.singleProductTotal))
                        const cart = new Cart(user.username, false, null, products.reduce((total, product) => total + (product.price*product.quantity), 0), products)
                        resolve(cart)
                    }
                })
        })
    }

    removeFromCart(user: User, model: string){
        return new Promise<Boolean>((resolve, reject) =>{
            const sql = "DELETE FROM cart_product WHERE product_id = (SELECT id FROM products WHERE model = ?) AND cart_id = (SELECT id FROM carts WHERE customer = ? AND paid = false)"
            db.run(sql, [model, user.username], (err: Error | null) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
        })
    }

    updateCart(user: User, model: string, quantity: number){
        return new Promise<Boolean>((resolve, reject) =>{
            const sql = "UPDATE cart_product SET quantity = quantity + ? WHERE product_id = (SELECT id FROM products WHERE model = ?) AND cart_id = (SELECT id FROM carts WHERE customer = ? AND paid = false)"
            db.run(sql, [quantity, model, user.username], (err: Error | null) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
        })
    }

    insertCart(user: User, model: string){
        return new Promise<Boolean>((resolve, reject) =>{
            const sql = "INSERT INTO cart_product  (cart_id, product_id, quantity) VALUES ((SELECT id FROM carts WHERE customer = ? AND paid = false), (SELECT id FROM products WHERE model = ?), 1)"
            db.run(sql, [user.username, model], (err: Error | null) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
        })
    }


    checkoutCart(user: User){
        return new Promise<Boolean>((resolve, reject) => {
            try{
                const sql = "UPDATE carts SET paid = true, paymentDate = ? WHERE customer = ? AND paid = false"
                db.run(sql, [new Date().toISOString().split("T")[0], user.username], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(true)
                })
            } catch(err){
                reject(err)
            }
        })
    }

    updateQuantity(model: string, quantity: number){
        return new Promise<Boolean>((resolve, reject) => {
            try{
                const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?"
                db.run(sql, [quantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(true)
                })
            } catch(err){
                reject(err)
            }
        })
    }

    getCartsID(user: User, paid: boolean){
        return new Promise<any[]>((resolve, reject) => {
            try {
                const sql = "SELECT id FROM carts WHERE customer = ? AND paid = ?"
                db.all(sql, [user.username, paid], (err: Error | null, rows: any[]) => {
                    if(err){
                        reject(err)
                    }
                    const ids: any[] = rows.map(row => row.id)
                    resolve(ids)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    checkProduct(model: string): Promise<Product>{
        return new Promise<Product>((resolve, reject) => {
            let sql = "SELECT * FROM products WHERE model = ?";
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    if(row === undefined) {
                        reject(new ProductNotFoundError())
                    }else if(row.quantity === 0) {
                        reject(new EmptyProductStockError())
                    }else{
                        const product = new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
                        resolve(product);
                    }
                }
            });

        })
    }

    getCartProducts(user: string, cartID: any){
        return new Promise<Cart>((resolve, reject) => {
            try {
                const sql = "SELECT P.model, P.category, P.sellingPrice as singleProductTotal, C.paid, C.paymentDate, CP.quantity FROM carts C LEFT JOIN cart_product CP ON CP.cart_id = C.id LEFT JOIN products P ON P.id = CP.product_id WHERE C.id = ?"
                db.all(sql, [cartID], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    if (rows[0].model === null) {
                        resolve(new Cart(user, false, null, 0, []))
                    }

                    const products: ProductInCart[] = rows.map(row => new ProductInCart(row.model, row.quantity, row.category, row.singleProductTotal))
                    const cart = new Cart(user, rows[0].paid, rows[0].paymentDate, products.reduce((total, product) => total + (product.price*product.quantity), 0), products)
                    resolve(cart)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    clearCart(id: any){
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql2 = "DELETE FROM cart_product WHERE cart_id = ?"
                db.run(sql2, [id], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                    }
                })
                resolve(true)
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteAllCarts(){
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM cart_product"
                db.run(sql, [], (err: Error | null) => {
                        if (err) {
                        reject(err)
                        return
                    }
                })
                const sql2 = "DELETE FROM carts"
                db.run(sql2, [], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getAllCarts(){
        class Tuple {
            id: any;
            username: string;

            constructor(id: any, username: string) {
                this.id = id;
                this.username = username;
            }
        }
        return new Promise<Tuple[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM carts"
                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(rows.map(row => new Tuple(row.id, row.customer)))
                })
            } catch (error) {
                reject(error)
            }
        })
    }


}

export default CartDAO