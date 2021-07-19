# frozen_string_literal: true

module FixturesHelper
  def load_fixture(file_name, test_case)
    file = Dir[fixtures_path.join('*.json')].map { |f| File.read(f) if f == "#{fixtures_path}/#{file_name}.json" }
    file = JSON.parse(file.first)
    fixture = file[test_case.to_s]
    OpenStruct.new(fixture)
  end

  def fixtures_path
    Rails.root.join('e2e', 'api', 'fixtures')
  end

  def from_csv(csv_row)
    hash = {
      merchant_queries_payload: {
        partner_id: @partner_id,
        name: csv_row['Legal Business name'],
        address_line_1: "#{csv_row['Street number']} #{csv_row['Street name']}",
        address_line_2: csv_row['suite'] == 'NA' ? nil : csv_row['suite'],
        city: csv_row['City'],
        state_province: csv_row['Province'],
        country: 'CANADA',
        postal_code: csv_row['Postal code'],
        phone_number: csv_row['Phone number']
      },
      merchant_queries_select_payload: {
        partner_id: @partner_id,
        industry: 'BAR',
        avg_monthly_sales: '1000.00',
        date_at_address: '12-02-1974'
      },
      create_applicant_payload: {
        partner_id: @partner_id,
        first_name: csv_row['First name'],
        last_name: csv_row['Last name'],
        date_of_birth: csv_row['Date of birth'],
        address_line1: "#{csv_row['Street number1']} #{csv_row['Street name1']}",
        owner_since: csv_row['Owner since'],
        ownerhip_percentage: 100,
        city: csv_row['City1'],
        province: csv_row['Province1'],
        country: 'CANADA',
        postal_code: csv_row['Postal code1'],
        sin: '000000000',
        email: 'test@example.com'
      }
    }
    OpenStruct.new hash
  end

  def preload_suppliers
    suppliers = get_suppliers
    suppliers.each do |supplier|
      @suppliers.each do |supplier_attributes|
        supplier_attributes[:guid] = supplier[:guid] if supplier_attributes[:name] == supplier[:name]
      end
    end

    @suppliers.each do |supplier|
      next if supplier[:guid]

      post_create_supplier(supplier)
    end
  end
end
