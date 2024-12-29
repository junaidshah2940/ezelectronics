const EXISTING_REVIEW = "You have already reviewed this product"
const NO_REVIEW = "You have not reviewed this product"
const NO_PRODUCT = "This product doesn't exist"

class ExistingReviewError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EXISTING_REVIEW
        this.customCode = 409
    }
}

class NoReviewProductError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = NO_REVIEW
        this.customCode = 404
    }
}

class ProductDoesntExist extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = NO_PRODUCT
        this.customCode = 404
    }
}

export { ExistingReviewError, NoReviewProductError, ProductDoesntExist }