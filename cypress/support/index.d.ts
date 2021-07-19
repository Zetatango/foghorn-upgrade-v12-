// in cypress/support/index.d.ts
// load type definitions that come with Cypress module
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        /**
         * Custom command to select DOM element by data-cy attribute.
         * @example cy.dataCy('greeting')
         */
        acceptApplication(accessToken, merchant_id): Chainable<Response>;
        switchProductConfigurations(accessToken, productConfigurations): Chainable<Response>;
        accessFunds(amount: string): void;
        checkDashboardAlert(content: string): Chainable<Element>;
        checkDashboardNames(legalBusinessName: string): Chainable<Element>;
        choosePayeeLoc(): void;
        clearEmails(): Chainable<Element>;
        clickOnApplyForWca(): Chainable<Element>;
        clickOnBecomeAPartner(): Chainable<Element>;
        clickOnCashFlowAdvisor(): Chainable<Element>;
        clickOnEditMerchantLink(): Chainable<Element>;
        clickOnMyBusiness(): Chainable<Element>;
        clickOnUploadDocuments(): Chainable<Element>;
        confirmUserEmail(): Chainable<Element>;
        connectBankAccount(): void;
        createConfirmedUser(accessToken: string, email: string): Chainable<Response>;
        createConfirmedUserWithMerchant(accessToken: string, email: string): Chainable<Response>;
        createConfirmedUserWithMerchantAndApplicant(accessToken: string, email: string, kycStatus?: Record<string, unknown>, bankAccount?: Record<string, unknown>, businessPartner?: Record<string, unknown>, merchant?: Record<string, unknown>): Chainable<Response>;
        dismissErrorDialog(): Chainable<Element>;
        dragAndDropFile(fileName: string): void;
        fillAboutBusinessForm(businessInfo: Record<string, unknown>): Chainable<Element>;
        fillAboutBusinessFormNoSelects(businessInfo: Record<string, unknown>): Chainable<Element>;
        fillAboutYouForm(applicantInfo: Record<string, unknown>): Chainable<Element>;
        fillAboutYouFormNoSelectedProvince(applicantInfo: Record<string, unknown>): Chainable<Element>;
        fillEditMerchantForm(merchantInfo: Record<string, unknown>): Chainable<Element>;
        fillInput(input: Chainable<Element>, value:any): Chainable<Element>;
        fillInvoiceForm(): void;
        fillPayeeForm(): void;
        getAccessToken(): Chainable<Response>;
        getApplications(merchant_id: string): Chainable<Element>;
        getInDocument(selector);
        iframeLoaded();
        internalLogin(email: string, password: string): Chainable<Element>;
        lenderLogin(email: string, password: string): Chainable<Element>;
        loanApprovalEmail(): Chainable<Element>;
        login(email: string, password: string): Chainable<Element>;
        logout(): Chainable<Element>;
        navigateToLeads(): void;
        parseAccessToken(tokenResponse: Record<string, unknown>): Chainable<Record<string, unknown>>;
        performAboutBusinessFormValidation(businessInfo: Record<string, unknown>): Chainable<Element>;
        performAboutYouFormValidation(applicantInfo: Record<string, unknown>): Chainable<Element>;
        reactivate(): void;
        reconnectBankAccount(): void;
        recertify(accessToken, merchant_id, offer_state, flinks_status?): Chainable<Response>;
        selectAuthenticationResponses(): Chainable<Element>;
        selectContaining(text: string | string[], options?: Partial<SelectOptions>): Chainable<Element>;
        selectFromDropdown(selectInput: Chainable<Element>, value: any): Chainable<Element>;
        setMinimumCashReserves(amount): Chainable<Element>;
        setMinimumCashReservesOnInvalidInput(amount): Chainable<Element>;
        signIn(): Chainable<Element>;
        signUp(): Chainable<Element>;
        signUpCfa(): Chainable<Element>;
        toggleBusinessInsights(): Chainable<Element>;
        uploadFile(fileName: string, mime: string): void;
    }
}
