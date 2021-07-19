class LeadsPage {
  addNewLeads(): void {
    this.uploadLeads(this.randomLeadsCsv(5), 'DreamPayments Campaign');
  }

  updateLeads(): void {
    this.uploadLeads(this.customLeadsCsv(['updated1', 'updated2', 'updated3', 'updated4', 'updated5']), 'DreamPayments Campaign');
    this.uploadLeads(this.customLeadsCsv(['updated1', 'updated2', 'updated3', 'updated4', 'updated5']), 'DreamPayments Campaign');
  }

  uploadBadCsv(): void {
    this.uploadLeads(this.malformedLeadsCsv(), 'DreamPayments Campaign');
  }

  leadsShowError(): void {
    cy.get('table').within(() => {
      cy.get('td').eq(1).contains('E2E Admin'); // col 1: Uploaded by
      cy.get('td').eq(6).contains('CSV is missing required fields'); // col 6: File errors
    });
  }

  leadsShowAdded(numAdded: number): void {
    cy.get('table').within(() => {
      cy.get('td').eq(1).contains('E2E Admin'); // col 1: Uploaded by
      cy.get('td').eq(5).contains('New leads: ' + numAdded + ' Updated leads: 0 Failed leads: 0'); // col 5: Details
    });
  }

  leadsShowUpdated(numUpdated: number): void {
    cy.get('table').within(() => {
      cy.get('td').eq(1).contains('E2E Admin'); // col 1: Uploaded by
      cy.get('td').eq(5).contains('New leads: 0 Updated leads: ' + numUpdated + ' Failed leads: 0'); // col 5: Details
    });
  }

  private uploadLeads(csv: string, campaign: string): void {
    // Select campaign
    cy.get('#upload_leads_csv_campaign_id').select(campaign);

    // Write CSV file in fixtures folder
    const fixture = 'leads/lead-' + (Math.floor(Math.random() * 10000) + 1) + '.csv';
    const filePath = 'cypress/fixtures/' + fixture;
    cy.writeFile(filePath, csv);

    // Upload CSV file
    cy.dragAndDropFile(fixture);
    cy.get('#add-doc-button').click();
    // TODO replace arbitrary wait with more reliable check
    cy.wait(5000); // wait for page refresh

    // Remove CSV file
    cy.exec('rm -rf ' + filePath);
  }

  /**
   * Generates leads csv with randomly generated external id to ensure uniqueness.
   *
   * @param numLeads number of lead rows to generate
   */
  private randomLeadsCsv(numLeads: number): string {
    let csv = this.leadCsvColumns();
    for (let i = 0; i < numLeads; i++) {
      csv += this.leadCsvRow('sf-' + (Math.floor(Math.random() * 10000) + 1));
    }
    return csv;
  }

  /**
   * Generates leads csv with passed list of external ids.
   *
   * @param leadIds list of external ids
   */
  private customLeadsCsv(leadIds: string[]): string {
    let csv = this.leadCsvColumns();
    leadIds.forEach((id) => {
      csv += this.leadCsvRow('sf-' + id);
    });
    return csv;
  }

  /**
   * Generates leads csv without required column names.
   */
  private malformedLeadsCsv(): string {
    return this.leadCsvRow('sf-error'); // no columns defined
  }

  private leadCsvColumns(): string {
    return 'external_id,' +
      'applicant_email,' +
      'applicant_first_name,' +
      'applicant_last_name,' +
      'merchant_name,' +
      'merchant_address_line_1,' +
      'merchant_address_line_2,' +
      'merchant_city,' +
      'merchant_postal_code,' +
      'merchant_state_province,' +
      'merchant_phone_number,' +
      'merchant_business_number,' +
      'merchant_jurisdiction,' +
      'merchant_industry,' +
      'merchant_doing_business_as,' +
      'applicant_address_line_1,' +
      'applicant_address_line_2,' +
      'applicant_city,' +
      'applicant_postal_code,' +
      'applicant_state_province,' +
      'applicant_date_of_birth,' +
      'applicant_owner_since,' +
      'applicant_phone_number,' +
      'bank_account_institution_number,' +
      'bank_account_transit_number,' +
      'bank_account_account_number\n';
  }

  private leadCsvRow(externalId: string): string {
    return externalId + ',' +
      'e2e+lead1@zetatango.com,' +
      'A,' +
      'CROMWELL,' +
      'SUN LIFE ASSURANCE CO. OF CDA.,' +
      '150 st e king,' +
      'NA,' +
      'TORONTO,' +
      'M5A1J3,' +
      'ON,' +
      '4169796031,' +
      '020402014,' +
      'ON,' +
      'SPORTING_GOODS,' +
      'SUN LIFE ASSURANCE CO. OF CDA.,' +
      '686 franklin,' +
      '"",' +
      'GALT,' +
      'N1R7Z1,' +
      'ON,' +
      '15-03-1975,' +
      '26-08-2017,' +
      '003,' +
      '40032,' +
      '1234567\n';
  }
}

export default LeadsPage;
