class LenderPortal {
  billmarketCampaign(): void {
    cy.contains('BillMarket Campaign').click();
  }

  clickMerchant(): void {
    cy.get('a[href="/merchants"]').click();
  }

  selectMerchant(): void {
    const merchant = '.merchants_server_body>.odd:nth-child(1)>.select-checkbox+td>a';
    cy.get(merchant, {timeout: 10000}).click({ force: true });
  }

  underwriting(): void {
    cy.contains('Underwriting').click();
  }

  sendToFirst(): void {
    cy.get('.fas.fa-arrow-right').should('be.visible').click();
  }

  startReview(): void {
    cy.get('.fas.fa-pencil-alt.fa-pencil').should('be.visible').click();
  }

  requestReSign(): void {
    cy.get('.fas.fa-file-signature').should('be.visible').click();
    cy.on('window:confirm', () => true);
    cy.contains('Application has been sent back for re-signing')
  }

  addNote(value: string): void {
    cy.get('#lending_adjudication_decision_notes').type(value).should('have.value', value);
  }

  recordDecision(): void {
    cy.get('#record-decision-button').click();
  }

    signOut(): void {
    cy.contains('Sign out').click();
  }
}

export default LenderPortal;
