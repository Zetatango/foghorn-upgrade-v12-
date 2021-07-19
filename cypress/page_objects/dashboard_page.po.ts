class DashboardPage {
  onDashboardPage(): void {
    cy.get('div[id=ztt-active-ubls').should('be.visible');
    cy.contains('Available Credit');
  }

  onBecomeAPartnerPage(): void {
    cy.get('div[id=business-partner-landing').should('be.visible');
    cy.contains('GET STARTED');
  }

  onDocumentsPage(): void {
    cy.get('ztt-documents').should('be.visible');
    cy.contains('Document manager');
  }

  onCashFlowAdvisorPage(): void {
    cy.get('#ztt-insights').should('be.visible');
  }
}

export default DashboardPage;
